import { IChatService } from '../../../Application/Contracts/IChatService';
import { ServiceProviderType } from '../../../Core/Domain/Enums/ServiceProviderType';
import { ChatServiceCreator } from '../Definitions/ChatServiceCreator';
import { IChatServiceFactory } from '../Definitions/IChatServiceFactory';

export class ChatServiceFactory implements IChatServiceFactory
{
  private readonly _creators = new Map<ServiceProviderType, ChatServiceCreator>();

  public Register(providerType: ServiceProviderType, creator: ChatServiceCreator): void
  {
    this._creators.set(providerType, creator);
  }

  public CreateChatService(providerType: ServiceProviderType): IChatService
  {
    const creator = this._creators.get(providerType);
    if (!creator)
    {
      throw new Error(`No chat service is registered for provider "${providerType}".`);
    }

    return creator();
  }
}
