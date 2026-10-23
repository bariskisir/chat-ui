import { NextResponse } from 'next/server';
import {
  IsReasoningEffort,
  ReasoningEffort
} from '../../../../src/Core/Domain/Enums/ReasoningEffort';
import {
  IsWebSearchMode,
  WebSearchEngine,
  WebSearchMode
} from '../../../../src/Core/Domain/Enums/WebSearchMode';
import { IChatCitation } from '../../../../src/Core/Domain/Entities/Definitions/IChatCitation';
import { StreamOpenCodeChatAsync } from '../../../../src/Server/OpenCode/OpenCodeClient';
import { IOpenCodeMessage } from '../../../../src/Server/OpenCode/OpenCodeProtocol';
import { SearchWebAsync } from '../../../../src/Server/WebSearch/WebSearchService';
import { BuildReferencePrompt } from '../../../../src/Server/WebSearch/WebSearchPrompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MaxPromptChars = 32_000;
const MaxHistoryMessages = 100;
const MaxHistoryChars = 240_000;

interface IChatRouteBody
{
  prompt: string;
  history: IOpenCodeMessage[];
  model: string;
  conversationId: string;
  reasoningEffort: ReasoningEffort;
  webSearchMode: WebSearchMode;
}

type StreamEvent =
  | { type: 'status'; value: 'searching' | 'generating' }
  | { type: 'content'; value: string }
  | { type: 'reasoning'; value: string }
  | { type: 'search'; phase: 'searching'; engine: WebSearchEngine }
  | { type: 'search'; phase: 'completed'; engine: WebSearchEngine; citations: IChatCitation[] }
  | { type: 'search'; phase: 'failed'; engine: WebSearchEngine }
  | { type: 'error'; message: string }
  | { type: 'done' };

/** Rejects malformed payloads before any upstream request is made. */
function ParseBody(value: unknown): IChatRouteBody | null
{
  if (!value || typeof value !== 'object' || Array.isArray(value))
  {
    return null;
  }

  const record = value as Record<string, unknown>;
  const prompt = typeof record.prompt === 'string' ? record.prompt.trim() : '';
  const model = typeof record.model === 'string' ? record.model.trim() : '';
  const conversationId = typeof record.conversationId === 'string'
    ? record.conversationId.trim()
    : '';

  if (!prompt || prompt.length > MaxPromptChars || !model || !conversationId)
  {
    return null;
  }

  const history: IOpenCodeMessage[] = [];
  let historyChars = 0;
  if (Array.isArray(record.history))
  {
    for (const entry of record.history.slice(0, MaxHistoryMessages))
    {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      {
        continue;
      }

      const message = entry as Record<string, unknown>;
      const role = message.role;
      const content = message.content;
      if (
        (role !== 'system' && role !== 'user' && role !== 'assistant')
        || typeof content !== 'string'
      )
      {
        continue;
      }

      const trimmed = content.trim();
      if (!trimmed)
      {
        continue;
      }

      historyChars += trimmed.length;
      if (historyChars > MaxHistoryChars)
      {
        return null;
      }

      history.push({ role, content: trimmed });
    }
  }

  const lastMessage = history[history.length - 1];
  if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== prompt)
  {
    history.push({ role: 'user', content: prompt });
  }

  const reasoningEffort = typeof record.reasoningEffort === 'string'
    ? record.reasoningEffort
    : 'default';
  const webSearchMode = typeof record.webSearchMode === 'string'
    ? record.webSearchMode
    : 'off';

  return {
    prompt,
    history,
    model,
    conversationId,
    reasoningEffort: IsReasoningEffort(reasoningEffort) ? reasoningEffort : 'default',
    webSearchMode: IsWebSearchMode(webSearchMode) ? webSearchMode : 'off'
  };
}

/** Returns the provider response for display in the chat. */
function DescribeError(error: unknown): string
{
  if (error instanceof Error && error.message.trim())
  {
    return error.message;
  }

  return 'The response could not be completed. Please try again.';
}

/** Streams one chat request with optional web-grounded context. */
export async function POST(request: Request): Promise<Response>
{
  let body: unknown;
  try
  {
    body = await request.json();
  }
  catch
  {
    return NextResponse.json({ message: 'The request body was invalid.' }, { status: 400 });
  }

  const payload = ParseBody(body);
  if (!payload)
  {
    return NextResponse.json({ message: 'The chat request was invalid.' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller)
    {
      let isClosed = false;
      const send = (event: StreamEvent): void =>
      {
        if (isClosed)
        {
          return;
        }

        try
        {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
        catch
        {
          isClosed = true;
        }
      };

      try
      {
        let messages = payload.history;

        if (payload.webSearchMode !== 'off')
        {
          const engine = payload.webSearchMode;
          send({ type: 'status', value: 'searching' });
          send({ type: 'search', phase: 'searching', engine });

          try
          {
            const searchResult = await SearchWebAsync(
              engine,
              [payload.prompt],
              request.signal
            );

            send({
              type: 'search',
              phase: 'completed',
              engine,
              citations: searchResult.Citations
            });

            if (searchResult.Context)
            {
              messages = [
                {
                  role: 'system',
                  content: BuildReferencePrompt(payload.prompt, searchResult)
                },
                ...messages
              ];
            }
          }
          catch (error)
          {
            if (request.signal.aborted)
            {
              throw error;
            }

            send({ type: 'search', phase: 'failed', engine });
          }
        }

        send({ type: 'status', value: 'generating' });

        await StreamOpenCodeChatAsync({
          ModelId: payload.model,
          ConversationId: payload.conversationId,
          Messages: messages,
          ReasoningEffort: payload.reasoningEffort,
          Signal: request.signal,
          OnDelta: (delta) =>
          {
            if (delta.Reasoning)
            {
              send({ type: 'reasoning', value: delta.Reasoning });
            }

            if (delta.Content)
            {
              send({ type: 'content', value: delta.Content });
            }
          }
        });

        send({ type: 'done' });
        isClosed = true;
        controller.close();
      }
      catch (error)
      {
        if (!request.signal.aborted)
        {
          send({ type: 'error', message: DescribeError(error) });
        }

        isClosed = true;
        try
        {
          controller.close();
        }
        catch
        {
          // The client may have already closed the stream.
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
