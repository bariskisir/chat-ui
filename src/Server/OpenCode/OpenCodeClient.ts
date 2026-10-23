/** Streams OpenCode responses while keeping transport details on the server. */

import { ReasoningEffort } from '../../Core/Domain/Enums/ReasoningEffort';
import {
  BuildChatRequest,
  BuildOpenCodeHeaders,
  BuildResponsesRequest,
  GetOpenCodeClientVersion,
  IOpenCodeMessage,
  IOpenCodeStreamDelta,
  OpenCodeBaseUrl,
  ParseChatLine,
  ParseResponsesLine,
  ResolveOpenCodeSessionId,
  StripChatReasoningParameters
} from './OpenCodeProtocol';

export interface IOpenCodeChatStreamOptions
{
  ModelId: string;
  ConversationId: string;
  Messages: IOpenCodeMessage[];
  ReasoningEffort: ReasoningEffort;
  Signal: AbortSignal;
  OnDelta(delta: IOpenCodeStreamDelta): void;
}

/** Reports a provider rejection together with its upstream response body. */
export class OpenCodeRequestError extends Error
{
  public readonly Status: number;
  public readonly Body: string;

  public constructor(status: number, body = '')
  {
    const trimmedBody = body.trim();
    super(trimmedBody
      ? `Provider returned ${status}.\n${trimmedBody}`
      : `Provider returned ${status}.`);
    this.name = 'OpenCodeRequestError';
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

/** Streams one chat completion, trying Responses first and falling back to chat. */
export async function StreamOpenCodeChatAsync(options: IOpenCodeChatStreamOptions): Promise<void>
{
  const clientVersion = await GetOpenCodeClientVersion();
  const sessionId = ResolveOpenCodeSessionId(options.ConversationId);
  const headers = BuildOpenCodeHeaders(clientVersion, sessionId);
  let hasEmittedDelta = false;

  const emit = (delta: IOpenCodeStreamDelta): void =>
  {
    if (delta.Content || delta.Reasoning)
    {
      hasEmittedDelta = true;
    }
    options.OnDelta(delta);
  };

  try
  {
    await StreamResponsesAsync(options, headers, emit);
  }
  catch (error)
  {
    if (options.Signal.aborted || hasEmittedDelta)
    {
      throw error;
    }

    await StreamChatAsync(options, headers, emit);
  }
}

/** Sends the Responses request and forwards its normalized deltas. */
async function StreamResponsesAsync(
  options: IOpenCodeChatStreamOptions,
  headers: HeadersInit,
  emit: (delta: IOpenCodeStreamDelta) => void
): Promise<void>
{
  if (options.Signal.aborted)
  {
    throw new Error('The request was stopped.');
  }

  const response = await fetch(
    `${OpenCodeBaseUrl}/responses`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(
        BuildResponsesRequest(options.Messages, options.ModelId, options.ReasoningEffort)
      ),
      signal: options.Signal,
      cache: 'no-store'
    }
  );

  if (!response.ok)
  {
    const body = await ReadErrorBodyAsync(response);
    throw new OpenCodeRequestError(response.status, body);
  }

  await ReadSseAsync(response, ParseResponsesLine, emit);
}

/** Sends the chat-completions request with its compatibility retries. */
async function StreamChatAsync(
  options: IOpenCodeChatStreamOptions,
  headers: HeadersInit,
  emit: (delta: IOpenCodeStreamDelta) => void
): Promise<void>
{
  if (options.Signal.aborted)
  {
    throw new Error('The request was stopped.');
  }

  const body = BuildChatRequest(options.Messages, options.ModelId, options.ReasoningEffort);
  const sendAsync = (): Promise<Response> =>
  {
    return fetch(
      `${OpenCodeBaseUrl}/chat/completions`,
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
    StripChatReasoningParameters(body);
    response = await sendAsync();
  }

  if (!response.ok)
  {
    const body = await ReadErrorBodyAsync(response);
    throw new OpenCodeRequestError(response.status, body);
  }

  await ReadSseAsync(response, ParseChatLine, emit);
}

/** Reads provider SSE lines and forwards content, reasoning, and completion. */
async function ReadSseAsync(
  response: Response,
  parseLine: (line: string) => IOpenCodeStreamDelta | null,
  emit: (delta: IOpenCodeStreamDelta) => void
): Promise<void>
{
  if (!response.body)
  {
    throw new Error('The OpenCode response had no body.');
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
        const delta = parseLine(line);
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
      const delta = parseLine(buffer);
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
