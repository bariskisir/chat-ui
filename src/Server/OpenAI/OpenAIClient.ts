/** Streams OpenAI-compatible responses while keeping transport details on the server. */

import { ReasoningEffort } from '../../Core/Domain/Enums/ReasoningEffort';
import {
  BuildOpenAIChatRequest,
  BuildOpenAIHeaders,
  IOpenAIMessage,
  IOpenAIStreamDelta,
  ParseOpenAIStreamLine,
  StripOpenAIReasoningParameters
} from './OpenAIProtocol';
import { RequireOpenAIProviderApiKey, ResolveOpenAIProvider, ResolveOpenAIProviderBaseUrl } from './OpenAIProviders';

export interface IOpenAIChatStreamOptions
{
  ProviderId: string;
  ModelId: string;
  Messages: IOpenAIMessage[];
  ReasoningEffort: ReasoningEffort;
  Signal: AbortSignal;
  OnDelta(delta: IOpenAIStreamDelta): void;
}

/** Reports a provider rejection together with its upstream response body. */
export class OpenAIRequestError extends Error
{
  public readonly Status: number;
  public readonly Body: string;

  public constructor(status: number, body = '')
  {
    const trimmedBody = body.trim();
    super(trimmedBody
      ? `Provider returned ${status}.\n${trimmedBody}`
      : `Provider returned ${status}.`);
    this.name = 'OpenAIRequestError';
    this.Status = status;
    this.Body = trimmedBody;
  }
}

const MaxErrorBodyLength = 8_000;

/** Reads a bounded provider error body so it can be shown in the chat. */
async function ReadErrorBodyAsync(response: Response): Promise<string>
{
  try
  {
    const body = (await response.text()).trim();
    if (body.length <= MaxErrorBodyLength)
    {
      return body;
    }

    return `${body.slice(0, MaxErrorBodyLength)}...`;
  }
  catch
  {
    return '';
  }
}

/** Streams one chat completion, retrying compatibility options the provider rejects. */
export async function StreamOpenAIChatAsync(options: IOpenAIChatStreamOptions): Promise<void>
{
  if (options.Signal.aborted)
  {
    throw new Error('The request was stopped.');
  }

  const provider = ResolveOpenAIProvider(options.ProviderId);
  const apiKey = RequireOpenAIProviderApiKey(provider);
  const endpoint = `${ResolveOpenAIProviderBaseUrl(provider)}/chat/completions`;
  const headers = BuildOpenAIHeaders(apiKey);
  const body = BuildOpenAIChatRequest(
    options.Messages,
    options.ModelId,
    options.ReasoningEffort
  );

  const sendAsync = (): Promise<Response> =>
  {
    return fetch(
      endpoint,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: options.Signal,
        cache: 'no-store'
      }
    );
  };

  let response = await sendAsync();
  if (response.status === 400 || response.status === 422)
  {
    await response.body?.cancel().catch(() => undefined);
    delete body.stream_options;
    response = await sendAsync();
  }

  if (response.status === 400 || response.status === 422)
  {
    await response.body?.cancel().catch(() => undefined);
    StripOpenAIReasoningParameters(body);
    response = await sendAsync();
  }

  if (!response.ok)
  {
    const errorBody = await ReadErrorBodyAsync(response);
    throw new OpenAIRequestError(response.status, errorBody);
  }

  if (!response.body)
  {
    throw new Error('The provider response had no body.');
  }

  await ReadSseAsync(response, options.OnDelta);
}

/** Reads provider SSE lines and forwards content, reasoning, and completion. */
async function ReadSseAsync(
  response: Response,
  emit: (delta: IOpenAIStreamDelta) => void
): Promise<void>
{
  if (!response.body)
  {
    throw new Error('The provider response had no body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let isDone = false;

  try
  {
    while (!isDone)
    {
      const chunk = await reader.read();
      if (chunk.done)
      {
        break;
      }

      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines)
      {
        const delta = ParseOpenAIStreamLine(line);
        if (!delta)
        {
          continue;
        }

        if (delta.Error)
        {
          throw new Error(delta.Error);
        }

        if (delta.Content || delta.Reasoning)
        {
          emit(delta);
        }

        if (delta.Done)
        {
          isDone = true;
          break;
        }
      }
    }

    if (!isDone && buffer.trim())
    {
      const delta = ParseOpenAIStreamLine(buffer);
      if (delta?.Error)
      {
        throw new Error(delta.Error);
      }
      if (delta && (delta.Content || delta.Reasoning))
      {
        emit(delta);
      }
    }
  }
  finally
  {
    reader.releaseLock();
  }
}
