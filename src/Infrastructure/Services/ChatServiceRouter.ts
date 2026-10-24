import { IChatService } from '../../Application/Contracts/IChatService';
import { ChatRequestDto } from '../../Application/DTOs/ChatRequestDto';
import { StreamCallbacksDto } from '../../Application/DTOs/StreamCallbacksDto';
import { IChatServiceFactory } from '../Factories/Definitions/IChatServiceFactory';

export class ChatServiceRouter implements IChatService
{
  private readonly _factory: IChatServiceFactory;

  public constructor(factory: IChatServiceFactory)
  {
    this._factory = factory;
  }

  public async StreamMessageAsync(
    request: ChatRequestDto,
    callbacks: StreamCallbacksDto
  ): Promise<void>
  {
    try
    {
      const service = this._factory.CreateChatService(request.Provider);
      await service.StreamMessageAsync(request, callbacks);
    }
    catch (error)
    {
      callbacks.OnError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
