import { IChatServiceFactory } from '../Definitions/IChatServiceFactory';
import { IChatService } from '../../../Application/Contracts/IChatService';
import { ServiceProviderType } from '../../../Core/Domain/Enums/ServiceProviderType';
import { MockChatService } from '../../Services/MockChatService';

export class ChatServiceFactory implements IChatServiceFactory
{
  public CreateChatService(providerType: ServiceProviderType): IChatService
  {
    switch (providerType)
    {
      case ServiceProviderType.Mock:
        return new MockChatService();
      case ServiceProviderType.OpenAI:
        return new MockChatService();
      case ServiceProviderType.Anthropic:
        return new MockChatService();
      default:
        return new MockChatService();
    }
  }
}
