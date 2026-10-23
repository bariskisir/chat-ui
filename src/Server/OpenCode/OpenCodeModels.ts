/** OpenCode free-model catalog and display names. */

import {
  BuildOpenCodeCatalogHeaders,
  GetOpenCodeClientVersion,
  OpenCodeBaseUrl
} from './OpenCodeProtocol';

export interface IOpenCodeModelInfo
{
  Id: string;
  Name: string;
  Badge: string;
}

const KnownFreeModelIds = new Set<string>(['big-pickle']);

const BrandNames: Record<string, string> = {
  beam: 'Beam',
  deepseek: 'DeepSeek',
  flint: 'Flint',
  glm: 'GLM',
  gpt: 'GPT',
  jev: 'Jev',
  longcat: 'LongCat',
  mimo: 'MiMo',
  nemotron: 'Nemotron'
};

/** Returns true for model identifiers available through the free tier. */
export function IsFreeOpenCodeModel(modelId: string): boolean
{
  const normalized = modelId.trim().toLowerCase();
  return normalized.includes('free') || KnownFreeModelIds.has(normalized);
}

/** Formats one model identifier without exposing provider descriptions. */
export function FormatOpenCodeModelName(modelId: string): string
{
  return modelId
    .split('-')
    .filter((token) => token.toLowerCase() !== 'free')
    .map((token) =>
    {
      const brandName = BrandNames[token.toLowerCase()];
      if (brandName)
      {
        return brandName;
      }

      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join(' ');
}

/** Fetches and filters the OpenCode model catalog to free models only. */
export async function FetchOpenCodeModelsAsync(signal?: AbortSignal): Promise<IOpenCodeModelInfo[]>
{
  const clientVersion = await GetOpenCodeClientVersion();
  const response = await fetch(
    `${OpenCodeBaseUrl}/models`,
    {
      headers: BuildOpenCodeCatalogHeaders(clientVersion),
      cache: 'no-store',
      signal: signal ?? AbortSignal.timeout(20_000)
    }
  );

  if (!response.ok)
  {
    throw new Error(`The OpenCode model catalog failed with status ${response.status}.`);
  }

  const payload = await response.json() as unknown;
  const records = payload
    && typeof payload === 'object'
    && Array.isArray((payload as { data?: unknown }).data)
    ? (payload as { data: unknown[] }).data
    : [];

  const seen = new Set<string>();
  const models: IOpenCodeModelInfo[] = [];
  for (const record of records)
  {
    if (!record || typeof record !== 'object' || Array.isArray(record))
    {
      continue;
    }

    const modelId = (record as Record<string, unknown>).id;
    if (typeof modelId !== 'string' || !modelId.trim())
    {
      continue;
    }

    const normalizedId = modelId.trim();
    if (!IsFreeOpenCodeModel(normalizedId) || seen.has(normalizedId))
    {
      continue;
    }

    seen.add(normalizedId);
    models.push({
      Id: normalizedId,
      Name: FormatOpenCodeModelName(normalizedId),
      Badge: 'Free'
    });
  }

  return models;
}
