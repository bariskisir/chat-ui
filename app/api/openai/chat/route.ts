import { NextResponse } from 'next/server';
import {
  IsReasoningEffort,
  ReasoningEffort
} from '../../../../src/Core/Domain/Enums/ReasoningEffort';
import {
  IsWebSearchMode,
  WebSearchMode
} from '../../../../src/Core/Domain/Enums/WebSearchMode';
import {
  CancelOpenAIChatJob,
  StartOpenAIChatJob
} from '../../../../src/Server/OpenAI/OpenAIChatJobs';
import { CreateOpenAIChatStreamResponse } from '../../../../src/Server/OpenAI/OpenAIChatStreamResponse';
import { IOpenAIMessage } from '../../../../src/Server/OpenAI/OpenAIProtocol';
import { ResolveOpenAIProvider } from '../../../../src/Server/OpenAI/OpenAIProviders';
import { IsWebSearchEnabled } from '../../../../src/Server/Configuration/WebSearchSettings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MaxPromptChars = 32_000;
const MaxHistoryMessages = 100;
const MaxHistoryChars = 240_000;

interface IChatRouteBody
{
  prompt: string;
  history: IOpenAIMessage[];
  model: string;
  providerId: string;
  conversationId: string;
  reasoningEffort: ReasoningEffort;
  webSearchMode: WebSearchMode;
}

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
  const providerId = typeof record.providerId === 'string' ? record.providerId.trim() : '';
  const conversationId = typeof record.conversationId === 'string'
    ? record.conversationId.trim()
    : '';

  if (!prompt || prompt.length > MaxPromptChars || !model || !providerId || !conversationId)
  {
    return null;
  }

  try
  {
    ResolveOpenAIProvider(providerId);
  }
  catch
  {
    return null;
  }

  const history: IOpenAIMessage[] = [];
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
    providerId,
    conversationId,
    reasoningEffort: IsReasoningEffort(reasoningEffort) ? reasoningEffort : 'default',
    webSearchMode: IsWebSearchEnabled() && IsWebSearchMode(webSearchMode)
      ? webSearchMode
      : 'off'
  };
}

/** Reads the job identifier and replay offset used when reattaching. */
function ParseJobQuery(
  request: Request
): { jobId: string; from: number } | null
{
  const parameters = new URL(request.url).searchParams;
  const jobId = parameters.get('jobId')?.trim() ?? '';
  if (!jobId)
  {
    return null;
  }

  const parsedFrom = Number.parseInt(parameters.get('from') ?? '0', 10);
  const from = Number.isFinite(parsedFrom) && parsedFrom > 0 ? parsedFrom : 0;

  return { jobId, from };
}

/**
 * Starts one chat generation and streams it back.
 * The job keeps running when this connection is interrupted by a background tab.
 */
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

  const jobId = StartOpenAIChatJob({
    Prompt: payload.prompt,
    Messages: payload.history,
    ModelId: payload.model,
    ProviderId: payload.providerId,
    ReasoningEffort: payload.reasoningEffort,
    WebSearchMode: payload.webSearchMode
  });

  const response = CreateOpenAIChatStreamResponse(jobId, 0, request.signal);
  if (!response)
  {
    return NextResponse.json(
      { message: 'The chat generation could not be started.' },
      { status: 503 }
    );
  }

  return response;
}

/** Reattaches to a running generation and replays events the client has not seen. */
export async function GET(request: Request): Promise<Response>
{
  const query = ParseJobQuery(request);
  if (!query)
  {
    return NextResponse.json({ message: 'The chat generation was not specified.' }, { status: 400 });
  }

  const response = CreateOpenAIChatStreamResponse(query.jobId, query.from, request.signal);
  if (!response)
  {
    return NextResponse.json(
      { message: 'The chat generation is no longer available.' },
      { status: 404 }
    );
  }

  return response;
}

/** Stops a running generation. */
export async function DELETE(request: Request): Promise<Response>
{
  const query = ParseJobQuery(request);
  if (!query)
  {
    return NextResponse.json({ message: 'The chat generation was not specified.' }, { status: 400 });
  }

  if (!CancelOpenAIChatJob(query.jobId))
  {
    return NextResponse.json(
      { message: 'The chat generation is no longer available.' },
      { status: 404 }
    );
  }

  return new Response(null, { status: 204 });
}
