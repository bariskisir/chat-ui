/** Pure OpenCode inference protocol helpers shared by the server routes. */

import { randomBytes } from 'node:crypto';
import { ReasoningEffort } from '../../Core/Domain/Enums/ReasoningEffort';

export const OpenCodeBaseUrl = 'https://opencode.ai/inference/v1';
export const OpenCodeLatestVersionUrl = 'https://opencode.ai/update/api/latest/cli/npm';
export const DefaultOpenCodeClientVersion = '2.1.4';
export const OpenCodePublicKey = 'public';

/** One OpenAI-compatible message accepted by the OpenCode endpoints. */
export interface IOpenCodeMessage
{
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** One normalized streaming delta emitted by the server. */
export interface IOpenCodeStreamDelta
{
  Content: string;
  Reasoning: string;
  Error: string;
  Done: boolean;
}

/** Tools the Responses endpoint requires for free-tier requests. */
export const OpenCodeResponsesTools: Array<Record<string, unknown>> = [
  {
    type: 'function',
    name: 'bash',
    description: 'Run a shell command',
    parameters: {
      type: 'object',
      properties: { command: { type: 'string' } },
      required: ['command'],
      additionalProperties: false
    },
    strict: false
  },
  {
    type: 'function',
    name: 'edit',
    description: 'Edit a file',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
      additionalProperties: false
    },
    strict: false
  },
  {
    type: 'function',
    name: 'glob',
    description: 'Find files by pattern',
    parameters: {
      type: 'object',
      properties: { pattern: { type: 'string' } },
      required: ['pattern'],
      additionalProperties: false
    },
    strict: false
  },
  {
    type: 'function',
    name: 'grep',
    description: 'Search file contents',
    parameters: {
      type: 'object',
      properties: { pattern: { type: 'string' } },
      required: ['pattern'],
      additionalProperties: false
    },
    strict: false
  },
  {
    type: 'function',
    name: 'read',
    description: 'Read a file',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
      additionalProperties: false
    },
    strict: false
  },
  {
    type: 'function',
    name: 'write',
    description: 'Write a file',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
      additionalProperties: false
    },
    strict: false
  }
];

/** Tools the chat-completions endpoint requires for free-tier requests. */
export const OpenCodeChatTools: Array<Record<string, unknown>> = OpenCodeResponsesTools.map(
  (tool) =>
  {
    const functionDefinition: Record<string, unknown> = { ...tool };
    delete functionDefinition.type;
    delete functionDefinition.strict;
    return {
      type: 'function',
      function: functionDefinition
    };
  }
);

const Base62Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SessionAffinityByConversation = new Map<string, string>();
let sessionCounter = 0;
let lastSessionTimestamp = 0;

/** Creates one canonical `ses_` identifier accepted by the free-tier gate. */
function CreateCanonicalSessionId(): string
{
  const timestamp = Date.now();
  if (timestamp !== lastSessionTimestamp)
  {
    lastSessionTimestamp = timestamp;
    sessionCounter = 0;
  }

  sessionCounter += 1;
  const current = BigInt(timestamp) * 0x1000n + BigInt(sessionCounter);
  const inverted = ~current;
  const time = Array.from({ length: 6 }, (_, index) =>
  {
    return Number((inverted >> BigInt(40 - 8 * index)) & 0xffn)
      .toString(16)
      .padStart(2, '0');
  }).join('');

  const bytes = randomBytes(14);
  let tail = '';
  for (const byte of bytes)
  {
    tail += Base62Alphabet[byte % Base62Alphabet.length];
  }

  return `ses_${time}${tail}`;
}

/** Reuses one canonical session identifier per local conversation. */
export function ResolveOpenCodeSessionId(conversationId: string): string
{
  const key = conversationId.trim() || 'default';
  const cached = SessionAffinityByConversation.get(key);
  if (cached)
  {
    return cached;
  }

  const created = CreateCanonicalSessionId();
  SessionAffinityByConversation.set(key, created);
  return created;
}

let cachedClientVersion: string | null = null;
let cachedClientVersionPromise: Promise<string> | null = null;

/** Resolves the OpenCode client version once per server process. */
export async function GetOpenCodeClientVersion(): Promise<string>
{
  if (cachedClientVersion)
  {
    return cachedClientVersion;
  }

  if (cachedClientVersionPromise)
  {
    return cachedClientVersionPromise;
  }

  cachedClientVersionPromise = (async () =>
  {
    try
    {
      const response = await fetch(
        OpenCodeLatestVersionUrl,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
          cache: 'no-store'
        }
      );

      if (response.ok)
      {
        const payload = await response.json() as Record<string, unknown>;
        const version = typeof payload.version === 'string' ? payload.version.trim() : '';
        if (version)
        {
          cachedClientVersion = version;
          return version;
        }
      }
    }
    catch
    {
      // The pinned client version is sufficient when the update endpoint is unreachable.
    }

    cachedClientVersion = DefaultOpenCodeClientVersion;
    return cachedClientVersion;
  })();

  return cachedClientVersionPromise;
}

/** Builds the mandatory versioned OpenCode user agent. */
export function OpenCodeUserAgent(version: string): string
{
  return `opencode/latest/${version}/cli`;
}

/** Builds the exact header set verified against the free-tier gate. */
export function BuildOpenCodeHeaders(clientVersion: string, sessionId: string): HeadersInit
{
  return {
    'Content-Type': 'application/json',
    'User-Agent': OpenCodeUserAgent(clientVersion),
    Authorization: `Bearer ${OpenCodePublicKey}`,
    'x-opencode-session': sessionId,
    'x-opencode-session-id': sessionId,
    'x-session-affinity': sessionId,
    'X-Session-Id': sessionId,
    'x-opencode-client': 'cli'
  };
}

/** Builds catalog request headers without chat session affinity. */
export function BuildOpenCodeCatalogHeaders(clientVersion: string): HeadersInit
{
  return {
    Accept: 'application/json',
    'User-Agent': OpenCodeUserAgent(clientVersion),
    Authorization: `Bearer ${OpenCodePublicKey}`,
    'x-opencode-client': 'cli'
  };
}

/**
 * Merges system prompts into every user message and removes system messages.
 * This mirrors the OpenCode CLI behavior that the free tier accepts reliably.
 */
export function ApplyOpenCodeSessionPolicy(messages: readonly IOpenCodeMessage[]): IOpenCodeMessage[]
{
  const systemTexts = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter((content) => content.length > 0);
  const prefix = [
    ...systemTexts,
    'Do not use tools.'
  ].join('\n\n');
  const withoutSystem = messages.filter((message) => message.role !== 'system');

  if (!withoutSystem.some((message) => message.role === 'user'))
  {
    return [{ role: 'user', content: prefix }, ...withoutSystem];
  }

  return withoutSystem.map((message) =>
  {
    if (message.role !== 'user' || message.content.startsWith(prefix))
    {
      return message;
    }

    return {
      ...message,
      content: message.content.trim()
        ? `${prefix}\n\n${message.content}`
        : prefix
    };
  });
}

/** Maps reasoning effort to the Responses API vocabulary. */
export function MapResponsesReasoningEffort(effort: ReasoningEffort): string | null
{
  switch (effort)
  {
    case 'off':
      return 'off';
    case 'low':
    case 'medium':
    case 'high':
    case 'xhigh':
      return effort;
    case 'default':
    default:
      return null;
  }
}

/** Builds the reasoning parameters used by chat completions. */
export function BuildChatReasoningParameters(
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
export function StripChatReasoningParameters(body: Record<string, unknown>): void
{
  delete body.reasoning_effort;
}

/** Builds one Responses API request body accepted by OpenCode. */
export function BuildResponsesRequest(
  messages: readonly IOpenCodeMessage[],
  modelId: string,
  effort: ReasoningEffort
): Record<string, unknown>
{
  const outgoingMessages = ApplyOpenCodeSessionPolicy(messages);
  const systemTexts = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter((content) => content.length > 0);
  const input = outgoingMessages.map((message) =>
  {
    return {
      type: 'message',
      role: message.role,
      content: [
        {
          type: message.role === 'assistant' ? 'output_text' : 'input_text',
          text: message.content
        }
      ]
    };
  });
  const responsesEffort = MapResponsesReasoningEffort(effort);
  const body: Record<string, unknown> = {
    model: modelId,
    input,
    stream: true,
    store: false,
    include: ['reasoning.encrypted_content'],
    instructions: systemTexts.join('\n\n').slice(0, 200_000) || '.',
    text: { verbosity: 'medium' },
    tools: OpenCodeResponsesTools
  };

  if (responsesEffort && responsesEffort !== 'off')
  {
    body.reasoning = { effort: responsesEffort, summary: 'auto' };
  }

  return body;
}

/** Builds one chat-completions request body accepted by OpenCode. */
export function BuildChatRequest(
  messages: readonly IOpenCodeMessage[],
  modelId: string,
  effort: ReasoningEffort
): Record<string, unknown>
{
  return {
    model: modelId,
    messages: ApplyOpenCodeSessionPolicy(messages),
    stream: true,
    stream_options: { include_usage: true },
    ...(BuildChatReasoningParameters(effort) ?? {}),
    tools: OpenCodeChatTools
  };
}

/** Parses one Responses API SSE line into normalized deltas. */
export function ParseResponsesLine(line: string): IOpenCodeStreamDelta | null
{
  const value = line.trim();
  if (!value.startsWith('data:'))
  {
    return null;
  }

  const data = value.slice(5).trim();
  if (!data || data === '[DONE]')
  {
    return null;
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

  const event = parsed as Record<string, unknown>;
  const type = typeof event.type === 'string' ? event.type : '';
  if (type === 'error')
  {
    return { Content: '', Reasoning: '', Error: data, Done: false };
  }

  if (type.includes('output_text.delta'))
  {
    return {
      Content: typeof event.delta === 'string' ? event.delta : '',
      Reasoning: '',
      Error: '',
      Done: false
    };
  }

  if (type.includes('reasoning_text.delta') || type.includes('reasoning_summary_text.delta'))
  {
    return {
      Content: '',
      Reasoning: typeof event.delta === 'string' ? event.delta : '',
      Error: '',
      Done: false
    };
  }

  if (type === 'response.completed')
  {
    return { Content: '', Reasoning: '', Error: '', Done: true };
  }

  return null;
}

/** Parses one chat-completions SSE line into normalized deltas. */
export function ParseChatLine(line: string): IOpenCodeStreamDelta | null
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
  if (record.error && typeof record.error === 'object')
  {
    return { Content: '', Reasoning: '', Error: data, Done: false };
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
  const content = typeof deltaRecord.content === 'string' ? deltaRecord.content : '';
  const reasoning = typeof deltaRecord.reasoning_content === 'string'
    ? deltaRecord.reasoning_content
    : typeof deltaRecord.reasoning === 'string'
      ? deltaRecord.reasoning
      : '';

  return {
    Content: content,
    Reasoning: reasoning,
    Error: '',
    Done: false
  };
}
