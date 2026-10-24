/** OpenAI-compatible model catalog and display names for every configured provider. */

import { BuildOpenAIHeaders } from './OpenAIProtocol';
import {
  IOpenAIProviderDefinition,
  OpenAIProviders,
  RequireOpenAIProviderApiKey,
  ResolveOpenAIProviderBaseUrl
} from './OpenAIProviders';

export interface IOpenAIModelInfo
{
  Id: string;
  Name: string;
  ProviderId: string;
  ProviderName: string;
}

const NonChatModelPattern =
  /(embed|embedding|rerank|retriev|nvclip|reward|guard|safety|topic-control|parse|detector|calibration|classifier|moderation|whisper|speech|audio|deplot)/i;

const BrandNames: Record<string, string> = {
  ai: 'AI',
  bolt: 'Bolt',
  chat: 'Chat',
  codellama: 'CodeLlama',
  codegemma: 'CodeGemma',
  codestral: 'Codestral',
  creative: 'Creative',
  dbrx: 'DBRX',
  deepseek: 'DeepSeek',
  fin: 'Fin',
  flash: 'Flash',
  fuyu: 'Fuyu',
  gemma: 'Gemma',
  glm: 'GLM',
  glimmer: 'Glimmer',
  gpt: 'GPT',
  granite: 'Granite',
  instruct: 'Instruct',
  jamba: 'Jamba',
  kimi: 'Kimi',
  kosmos: 'Kosmos',
  large: 'Large',
  lightning: 'Lightning',
  llama: 'Llama',
  med: 'Med',
  minimax: 'MiniMax',
  minimaxai: 'MiniMax AI',
  mistral: 'Mistral',
  mistralai: 'MistralAI',
  mixtral: 'Mixtral',
  moe: 'MoE',
  muse: 'Muse',
  nano: 'Nano',
  nemotron: 'Nemotron',
  neva: 'Neva',
  nv: 'NV',
  omni: 'Omni',
  oss: 'OSS',
  palmyra: 'Palmyra',
  phi: 'Phi',
  preview: 'Preview',
  qa: 'QA',
  reasoning: 'Reasoning',
  riva: 'Riva',
  sea: 'Sea',
  starcoder: 'StarCoder',
  super: 'Super',
  translate: 'Translate',
  ultra: 'Ultra',
  vila: 'VILA',
  vision: 'Vision',
  vl: 'VL',
  vlm: 'VLM',
  yi: 'Yi',
  zamba: 'Zamba'
};

/** Returns true for model identifiers that accept chat messages. */
export function IsOpenAIChatModel(modelId: string): boolean
{
  return !NonChatModelPattern.test(modelId);
}

/** Formats one token of a model identifier for display. */
function FormatToken(token: string): string
{
  const brandName = BrandNames[token.toLowerCase()];
  if (brandName)
  {
    return brandName;
  }

  if (/^\d+(?:\.\d+)?[bkm]$/i.test(token))
  {
    return `${token.slice(0, -1)}${token.slice(-1).toUpperCase()}`;
  }

  if (/^[a-z]\d+[a-z]$/i.test(token))
  {
    return token.toUpperCase();
  }

  return token.charAt(0).toUpperCase() + token.slice(1);
}

/** Formats the model segment of an identifier without exposing provider descriptions. */
export function FormatOpenAIModelName(modelId: string): string
{
  const normalized = modelId.trim();
  const modelName = normalized.includes('/')
    ? normalized.slice(normalized.indexOf('/') + 1)
    : normalized;

  return modelName
    .split(/[-_]/)
    .filter((token) => token.length > 0)
    .map((token) => FormatToken(token))
    .join(' ');
}

/** Fetches and filters one provider catalog. */
async function FetchProviderModelsAsync(
  provider: IOpenAIProviderDefinition,
  signal?: AbortSignal
): Promise<IOpenAIModelInfo[]>
{
  const apiKey = RequireOpenAIProviderApiKey(provider);
  const response = await fetch(
    `${ResolveOpenAIProviderBaseUrl(provider)}/models`,
    {
      headers: BuildOpenAIHeaders(apiKey),
      signal: signal ?? AbortSignal.timeout(20_000),
      cache: 'no-store'
    }
  );

  if (!response.ok)
  {
    throw new Error(
      `The ${provider.Name} model catalog request failed with status ${response.status}.`
    );
  }

  const payload = await response.json() as unknown;
  const records = payload
    && typeof payload === 'object'
    && Array.isArray((payload as { data?: unknown }).data)
    ? (payload as { data: unknown[] }).data
    : [];

  const seen = new Set<string>();
  const models: IOpenAIModelInfo[] = [];
  for (const record of records)
  {
    if (!record || typeof record !== 'object' || Array.isArray(record))
    {
      continue;
    }

    const raw = record as Record<string, unknown>;
    const modelId = typeof raw.id === 'string' ? raw.id.trim() : '';
    if (!modelId || seen.has(modelId) || !IsOpenAIChatModel(modelId))
    {
      continue;
    }

    seen.add(modelId);
    models.push({
      Id: modelId,
      Name: FormatOpenAIModelName(modelId),
      ProviderId: provider.Id,
      ProviderName: provider.Name
    });
  }

  return models;
}

/** Fetches every configured provider catalog, keeping healthy providers available. */
export async function FetchOpenAIModelsAsync(
  signal?: AbortSignal
): Promise<IOpenAIModelInfo[]>
{
  const results = await Promise.allSettled(
    OpenAIProviders.map((provider) => FetchProviderModelsAsync(provider, signal))
  );

  const models: IOpenAIModelInfo[] = [];
  const errors: unknown[] = [];
  for (const result of results)
  {
    if (result.status === 'fulfilled')
    {
      models.push(...result.value);
      continue;
    }

    errors.push(result.reason);
  }

  if (models.length === 0 && errors.length > 0)
  {
    const firstError = errors[0];
    throw firstError instanceof Error ? firstError : new Error(String(firstError));
  }

  return models.sort((left, right) =>
  {
    return left.ProviderName.localeCompare(right.ProviderName)
      || left.Name.localeCompare(right.Name);
  });
}
