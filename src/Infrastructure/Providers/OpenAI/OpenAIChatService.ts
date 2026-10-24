import { IChatService } from '../../../Application/Contracts/IChatService';
import { ChatRequestDto } from '../../../Application/DTOs/ChatRequestDto';
import { StreamCallbacksDto } from '../../../Application/DTOs/StreamCallbacksDto';
import { OpenAIApiClient } from './OpenAIApiClient';
import { OpenAIApiError } from './OpenAIApiError';
import { OpenAIMessageMapper } from './OpenAIMessageMapper';
import { OpenAIStreamParser } from './OpenAIStreamParser';

const ReconnectDelayMs = 400;
const ReconnectWindowMs = 10 * 60_000;

/** Waits before retrying a stream that was interrupted by the browser. */
function DelayAsync(milliseconds: number): Promise<void>
{
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class OpenAIChatService implements IChatService
{
  private readonly _apiClient: OpenAIApiClient;
  private readonly _messageMapper: OpenAIMessageMapper;
  private readonly _streamParser: OpenAIStreamParser;

  public constructor(
    apiClient: OpenAIApiClient = new OpenAIApiClient(),
    messageMapper: OpenAIMessageMapper = new OpenAIMessageMapper(),
    streamParser: OpenAIStreamParser = new OpenAIStreamParser()
  )
  {
    this._apiClient = apiClient;
    this._messageMapper = messageMapper;
    this._streamParser = streamParser;
  }

  public async StreamMessageAsync(
    request: ChatRequestDto,
    callbacks: StreamCallbacksDto
  ): Promise<void>
  {
    let jobId = '';
    let nextIndex = 0;
    let fullText = '';
    let isCompleted = false;
    let reconnectDeadline = 0;
    let activeConnection: AbortController | null = null;

    const handleChunk = (chunk: string): void =>
    {
      fullText += chunk;
      callbacks.OnChunk(chunk);
    };

    const handleVisibilityChange = (): void =>
    {
      if (isCompleted || !jobId || typeof document === 'undefined')
      {
        return;
      }

      if (document.visibilityState === 'visible')
      {
        // Force a fresh connection so a stream suspended in the background catches up.
        activeConnection?.abort();
      }
    };

    if (typeof document !== 'undefined')
    {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    try
    {
      while (!isCompleted)
      {
        if (request.AbortSignal?.aborted)
        {
          if (jobId)
          {
            await this._apiClient.CancelChatAsync(jobId);
          }

          callbacks.OnComplete('');
          return;
        }

        const connection = new AbortController();
        activeConnection = connection;

        const abortConnection = (): void => connection.abort();
        request.AbortSignal?.addEventListener('abort', abortConnection, { once: true });

        try
        {
          let stream: ReadableStream<Uint8Array>;
          if (jobId)
          {
            stream = await this._apiClient.ResumeChatAsync(
              jobId,
              nextIndex,
              connection.signal
            );
          }
          else
          {
            const response = await this._apiClient.StreamChatAsync(
              {
                prompt: request.Prompt,
                history: this._messageMapper.Map(request.History, request.Prompt),
                model: request.Model,
                providerId: request.ProviderId,
                conversationId: request.ConversationId,
                reasoningEffort: request.ReasoningEffort,
                webSearchMode: request.WebSearchMode
              },
              connection.signal
            );

            jobId = response.JobId;
            stream = response.Body;
          }

          const result = await this._streamParser.ParseAsync(
            stream,
            handleChunk,
            callbacks.OnReasoning,
            callbacks.OnSearch,
            connection.signal,
            (id: string) =>
            {
              jobId = id;
            },
            (index: number) =>
            {
              nextIndex = Math.max(nextIndex, index + 1);
            }
          );

          if (result.ErrorMessage)
          {
            callbacks.OnError(new Error(result.ErrorMessage));
            return;
          }

          if (result.IsCompleted)
          {
            isCompleted = true;
          }
        }
        catch (error)
        {
          if (request.AbortSignal?.aborted)
          {
            if (jobId)
            {
              await this._apiClient.CancelChatAsync(jobId);
            }

            callbacks.OnComplete('');
            return;
          }

          // An expired job cannot be resumed, so fail instead of retrying forever.
          if (error instanceof OpenAIApiError && error.StatusCode === 404)
          {
            throw error;
          }

          // Without a job identifier there is nothing to resume.
          if (!jobId)
          {
            throw error;
          }

          if (reconnectDeadline === 0)
          {
            reconnectDeadline = Date.now() + ReconnectWindowMs;
          }

          if (Date.now() > reconnectDeadline)
          {
            throw error;
          }
        }
        finally
        {
          request.AbortSignal?.removeEventListener('abort', abortConnection);

          if (activeConnection === connection)
          {
            activeConnection = null;
          }
        }

        if (!isCompleted)
        {
          await DelayAsync(ReconnectDelayMs);
        }
      }

      callbacks.OnComplete(fullText);
    }
    catch (error)
    {
      if (request.AbortSignal?.aborted)
      {
        callbacks.OnComplete('');
        return;
      }

      callbacks.OnError(error instanceof Error ? error : new Error(String(error)));
    }
    finally
    {
      if (typeof document !== 'undefined')
      {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    }
  }
}
