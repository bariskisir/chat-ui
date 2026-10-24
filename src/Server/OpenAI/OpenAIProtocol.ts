/** Pure OpenAI-compatible protocol helpers shared by the server routes. */

import { ReasoningEffort } from '../../Core/Domain/Enums/ReasoningEffort';

/** One OpenAI-compatible message accepted by the provider. */
export interface IOpenAIMessage
{
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** One normalized streaming delta emitted by the server. */
export interface IOpenAIStreamDelta
{
  Content: string;
  Reasoning: string;
  Error: string;
  Done: boolean;
}

/** Builds the header set used by model catalog and chat requests. */
export function BuildOpenAIHeaders(apiKey: string): HeadersInit
{
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

/** Maps reasoning effort to the portable OpenAI-compatible parameter. */
export function BuildOpenAIReasoningParameters(
  effort: ReasoningEffort
): Record<string, unknown> | null
{
  if (effort === 'default')
  {
    return null;
  }

  return { reasoning_effort: effort === 'off' ? 'none' : effort };
}

/** Removes reasoning parameters before retrying a rejected chat request. */
export function StripOpenAIReasoningParameters(body: Record<string, unknown>): void
{
  delete body.reasoning_effort;
}

/** Builds one chat-completions request body accepted by OpenAI-compatible providers. */
export function BuildOpenAIChatRequest(
  messages: readonly IOpenAIMessage[],
  modelId: string,
  effort: ReasoningEffort
): Record<string, unknown>
{
  return {
    model: modelId,
    messages: [...messages],
    stream: true,
    stream_options: { include_usage: true },
    ...(BuildOpenAIReasoningParameters(effort) ?? {})
  };
}

/** Reads reasoning text from common OpenAI-compatible streaming fields. */
function ReadReasoningDelta(record: Record<string, unknown>): string
{
  if (typeof record.reasoning_content === 'string')
  {
    return record.reasoning_content;
  }

  if (typeof record.reasoningContent === 'string')
  {
    return record.reasoningContent;
  }

  if (typeof record.reasoning === 'string')
  {
    return record.reasoning;
  }

  if (typeof record.thinking_content === 'string')
  {
    return record.thinking_content;
  }

  if (typeof record.thinking === 'string')
  {
    return record.thinking;
  }

  if (!Array.isArray(record.reasoning_details))
  {
    return '';
  }

  return record.reasoning_details
    .flatMap((detail) =>
    {
      if (!detail || typeof detail !== 'object' || Array.isArray(detail))
      {
        return [];
      }

      const value = detail as Record<string, unknown>;
      if (typeof value.text === 'string')
      {
        return [value.text];
      }

      if (typeof value.summary === 'string')
      {
        return [value.summary];
      }

      return [];
    })
    .join('');
}

/** Reads a provider error message without discarding the original payload. */
function ReadStreamError(record: Record<string, unknown>, rawData: string): string
{
  const error = record.error;
  if (typeof error === 'string' && error.trim())
  {
    return error.trim();
  }

  if (error && typeof error === 'object' && !Array.isArray(error))
  {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim())
    {
      return message.trim();
    }
  }

  return rawData;
}

/** Parses one chat-completions SSE line into normalized deltas. */
export function ParseOpenAIStreamLine(line: string): IOpenAIStreamDelta | null
{
  const value = line.trim();
  if (!value.startsWith('data:'))
  {
    return null;
  }

  const data = value.slice(5).trim();
  if (!data)
  {
    return null;
  }

  if (data === '[DONE]')
  {
    return { Content: '', Reasoning: '', Error: '', Done: true };
  }

  let parsed: unknown;
  try
  {
    parsed = JSON.parse(data) as unknown;
  }
  catch
  {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
  {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  if (record.error)
  {
    return {
      Content: '',
      Reasoning: '',
      Error: ReadStreamError(record, data),
      Done: false
    };
  }

  const choices = Array.isArray(record.choices) ? record.choices : [];
  const choice = choices[0];
  if (!choice || typeof choice !== 'object' || Array.isArray(choice))
  {
    return null;
  }

  const delta = (choice as Record<string, unknown>).delta;
  if (!delta || typeof delta !== 'object' || Array.isArray(delta))
  {
    return null;
  }

  const deltaRecord = delta as Record<string, unknown>;

  return {
    Content: typeof deltaRecord.content === 'string' ? deltaRecord.content : '',
    Reasoning: ReadReasoningDelta(deltaRecord),
    Error: '',
    Done: false
  };
}
