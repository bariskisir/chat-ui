/** OpenAI-compatible provider definitions. Add another provider by extending this list. */

export interface IOpenAIProviderDefinition
{
  Id: string;
  Name: string;
  BaseUrl: string;
  ApiKeyEnvironmentVariable: string;
}

/** Providers served through the OpenAI-compatible protocol. */
export const OpenAIProviders: readonly IOpenAIProviderDefinition[] = [
  {
    Id: 'nvidia',
    Name: 'NVIDIA',
    BaseUrl: 'https://integrate.api.nvidia.com/v1',
    ApiKeyEnvironmentVariable: 'NVIDIA_API_KEY'
  }
];

/** Returns one configured provider, defaulting to the first entry. */
export function ResolveOpenAIProvider(providerId = ''): IOpenAIProviderDefinition
{
  const normalizedId = providerId.trim();
  const provider = normalizedId
    ? OpenAIProviders.find((item) => item.Id === normalizedId)
    : OpenAIProviders[0];

  if (!provider)
  {
    throw new Error('The selected provider is not configured.');
  }

  return provider;
}

/** Returns one provider base URL without a trailing slash. */
export function ResolveOpenAIProviderBaseUrl(provider: IOpenAIProviderDefinition): string
{
  return provider.BaseUrl.trim().replace(/\/+$/, '');
}

/** Returns the provider API key or rejects the request before it reaches the upstream. */
export function RequireOpenAIProviderApiKey(provider: IOpenAIProviderDefinition): string
{
  const apiKey = process.env[provider.ApiKeyEnvironmentVariable]?.trim();
  if (!apiKey)
  {
    throw new Error(
      `The ${provider.ApiKeyEnvironmentVariable} environment variable is not configured.`
    );
  }

  return apiKey;
}
