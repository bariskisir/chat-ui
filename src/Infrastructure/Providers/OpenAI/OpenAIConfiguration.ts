export class OpenAIConfiguration
{
  private static readonly DefaultBaseUrl = '/api/openai';

  public readonly BaseUrl: string;

  public constructor(baseUrl: string = OpenAIConfiguration.DefaultBaseUrl)
  {
    this.BaseUrl = (baseUrl.trim() || OpenAIConfiguration.DefaultBaseUrl).replace(/\/+$/, '');
  }

  public GetEndpoint(path: string): string
  {
    return `${this.BaseUrl}${path}`;
  }
}
