import { IChatService } from '../../../Application/Contracts/IChatService';
import { ChatRequestDto } from '../../../Application/DTOs/ChatRequestDto';
import { StreamCallbacksDto } from '../../../Application/DTOs/StreamCallbacksDto';
import { OpenCodeApiClient } from './OpenCodeApiClient';
import { OpenCodeMessageMapper } from './OpenCodeMessageMapper';
import { OpenCodeStreamParser } from './OpenCodeStreamParser';

export class OpenCodeChatService implements IChatService
{
  private readonly _apiClient: OpenCodeApiClient;
  private readonly _messageMapper: OpenCodeMessageMapper;
  private readonly _streamParser: OpenCodeStreamParser;

  public constructor(
    apiClient: OpenCodeApiClient = new OpenCodeApiClient(),
    messageMapper: OpenCodeMessageMapper = new OpenCodeMessageMapper(),
    streamParser: OpenCodeStreamParser = new OpenCodeStreamParser()
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
    try
    {
      const stream = await this._apiClient.StreamChatAsync(
        {
          prompt: request.Prompt,
          history: this._messageMapper.Map(request.History, request.Prompt),
          model: request.Model,
          conversationId: request.ConversationId,
          reasoningEffort: request.ReasoningEffort,
          webSearchMode: request.WebSearchMode
        },
        request.AbortSignal
      );

      const fullText = await this._streamParser.ParseAsync(
        stream,
        callbacks.OnChunk,
        callbacks.OnReasoning,
        callbacks.OnSearch,
        request.AbortSignal
      );

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
  }
}
