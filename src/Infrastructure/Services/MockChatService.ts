import { IChatService } from '../../Application/Contracts/IChatService';
import { ChatRequestDto } from '../../Application/DTOs/ChatRequestDto';
import { StreamCallbacksDto } from '../../Application/DTOs/StreamCallbacksDto';
import { TextChunkStreamer } from './TextChunkStreamer';

export class MockChatService implements IChatService
{
  private static readonly ResponseText =
    'This is the local Mock model. It streams canned text without calling any API, so it works offline. Select an API model from the picker to send a real request through the app server.';

  private readonly _textStreamer: TextChunkStreamer;

  public constructor(textStreamer: TextChunkStreamer = new TextChunkStreamer())
  {
    this._textStreamer = textStreamer;
  }

  public async StreamMessageAsync(
    request: ChatRequestDto,
    callbacks: StreamCallbacksDto
  ): Promise<void>
  {
    try
    {
      const streamedText = await this._textStreamer.StreamAsync(
        MockChatService.ResponseText,
        callbacks.OnChunk,
        request.AbortSignal,
        55
      );

      callbacks.OnComplete(streamedText);
    }
    catch (error)
    {
      callbacks.OnError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
