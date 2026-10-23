import { IOpenCodeChatRequestDto } from './DTOs/IOpenCodeChatRequestDto';
import { IOpenCodeModelDto } from './DTOs/IOpenCodeModelDto';
import { IOpenCodeModelsResponseDto } from './DTOs/IOpenCodeModelsResponseDto';
import { OpenCodeApiError } from './OpenCodeApiError';
import { OpenCodeConfiguration } from './OpenCodeConfiguration';

export class OpenCodeApiClient
{
  private static readonly ModelsPath = '/models';
  private static readonly ChatPath = '/chat';

  private readonly _configuration: OpenCodeConfiguration;

  public constructor(configuration: OpenCodeConfiguration = new OpenCodeConfiguration())
  {
    this._configuration = configuration;
  }

  public async GetModelsAsync(): Promise<IOpenCodeModelDto[]>
  {
    const response = await fetch(
      this._configuration.GetEndpoint(OpenCodeApiClient.ModelsPath),
      {
        headers: {
          Accept: 'application/json'
        },
        cache: 'no-store'
      }
    );

    await this.EnsureSuccessAsync(response);

    const payload = await response.json() as IOpenCodeModelsResponseDto;
    if (!payload || !Array.isArray(payload.models))
    {
      throw new Error('The model catalog response was invalid.');
    }

    return payload.models;
  }

  public async StreamChatAsync(
    request: IOpenCodeChatRequestDto,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>
  {
    const response = await fetch(
      this._configuration.GetEndpoint(OpenCodeApiClient.ChatPath),
      {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        signal
      }
    );

    await this.EnsureSuccessAsync(response);

    if (!response.body)
    {
      throw new Error('The chat response was empty.');
    }

    return response.body;
  }

  private async EnsureSuccessAsync(response: Response): Promise<void>
  {
    if (response.ok)
    {
      return;
    }

    let message = 'The chat request could not be completed.';
    try
    {
      const payload = await response.json() as { message?: unknown };
      if (typeof payload.message === 'string' && payload.message.trim())
      {
        message = payload.message.trim();
      }
    }
    catch
    {
      // Status-only failures use the generic message above.
    }

    throw new OpenCodeApiError(response.status, message);
  }
}
