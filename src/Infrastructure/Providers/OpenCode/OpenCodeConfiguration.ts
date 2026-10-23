export class OpenCodeConfiguration
{
  private static readonly DefaultBaseUrl = '/api/opencode';

  public readonly BaseUrl: string;

  public constructor(baseUrl: string = OpenCodeConfiguration.DefaultBaseUrl)
  {
    this.BaseUrl = (baseUrl.trim() || OpenCodeConfiguration.DefaultBaseUrl).replace(/\/+$/, '');
  }

  public GetEndpoint(path: string): string
  {
    return `${this.BaseUrl}${path}`;
  }
}
