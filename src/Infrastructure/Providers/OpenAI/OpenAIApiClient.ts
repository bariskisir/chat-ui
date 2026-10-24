import { IOpenAIChatRequestDto } from './DTOs/IOpenAIChatRequestDto';
import { IOpenAIModelDto } from './DTOs/IOpenAIModelDto';
import { IOpenAIModelsResponseDto } from './DTOs/IOpenAIModelsResponseDto';
import { OpenAIApiError } from './OpenAIApiError';
import { OpenAIConfiguration } from './OpenAIConfiguration';

export interface IOpenAIChatStreamResponse
{
  JobId: string;
  Body: ReadableStream<Uint8Array>;
}

export class OpenAIApiClient
{
  private static readonly ModelsPath = '/models';
  private static readonly ChatPath = '/chat';

  private readonly _configuration: OpenAIConfiguration;

  public constructor(configuration: OpenAIConfiguration = new OpenAIConfiguration())
  {
    this._configuration = configuration;
  }

  public async GetModelsAsync(): Promise<IOpenAIModelDto[]>
  {
    const response = await fetch(
      this._configuration.GetEndpoint(OpenAIApiClient.ModelsPath),
      {
        headers: {
          Accept: 'application/json'
        },
        cache: 'no-store'
      }
    );

    await this.EnsureSuccessAsync(response);

    const payload = await response.json() as IOpenAIModelsResponseDto;
    if (!payload || !Array.isArray(payload.models))
    {
      throw new Error('The model catalog response was invalid.');
    }

    return payload.models;
  }

  public async StreamChatAsync(
    request: IOpenAIChatRequestDto,
    signal?: AbortSignal
  ): Promise<IOpenAIChatStreamResponse>
  {
    const response = await fetch(
      this._configuration.GetEndpoint(OpenAIApiClient.ChatPath),
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

    const jobId = response.headers.get('X-Chat-Job-Id')?.trim() ?? '';
    if (!jobId)
    {
      throw new Error('The chat generation identifier was missing.');
    }

    return {
      JobId: jobId,
      Body: response.body
    };
  }

  /** Reattaches to a running generation after the first stream was interrupted. */
  public async ResumeChatAsync(
    jobId: string,
    from: number,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>
  {
    const endpoint = this._configuration.GetEndpoint(
      `${OpenAIApiClient.ChatPath}?jobId=${encodeURIComponent(jobId)}&from=${Math.max(0, from)}`
    );
    const response = await fetch(
      endpoint,
      {
        headers: {
          Accept: 'text/event-stream'
        },
        signal,
        cache: 'no-store'
      }
    );

    await this.EnsureSuccessAsync(response);

    if (!response.body)
    {
      throw new Error('The chat response was empty.');
    }

    return response.body;
  }

  /** Stops a generation that is still running on the server. */
  public async CancelChatAsync(jobId: string): Promise<void>
  {
    try
    {
      await fetch(
        this._configuration.GetEndpoint(
          `${OpenAIApiClient.ChatPath}?jobId=${encodeURIComponent(jobId)}`
        ),
        {
          method: 'DELETE',
          cache: 'no-store'
        }
      );
    }
    catch
    {
      // The job may have already finished or expired.
    }
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

    throw new OpenAIApiError(response.status, message);
  }
}
