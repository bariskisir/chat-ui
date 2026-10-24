import { IChatService } from '../../Application/Contracts/IChatService';
import { IModelRepository } from '../../Application/Contracts/IModelRepository';
import { ServiceProviderType } from '../../Core/Domain/Enums/ServiceProviderType';
import { ChatServiceFactory } from '../Factories/Implementations/ChatServiceFactory';
import { MockModelRepository } from '../Providers/Mock/MockModelRepository';
import { OpenAIChatService } from '../Providers/OpenAI/OpenAIChatService';
import { OpenAIModelRepository } from '../Providers/OpenAI/OpenAIModelRepository';
import { CompositeModelRepository } from '../Repositories/CompositeModelRepository';
import { SessionCachedModelRepository } from '../Repositories/SessionCachedModelRepository';
import { BrowserSessionStorageService } from '../Services/BrowserSessionStorageService';
import { ChatServiceRouter } from '../Services/ChatServiceRouter';
import { MockChatService } from '../Services/MockChatService';

export function CreateChatService(): IChatService
{
  const factory = new ChatServiceFactory();

  factory.Register(ServiceProviderType.Mock, () => new MockChatService());
  factory.Register(ServiceProviderType.OpenAI, () => new OpenAIChatService());

  return new ChatServiceRouter(factory);
}

export function CreateModelRepository(): IModelRepository
{
  return new SessionCachedModelRepository(
    new CompositeModelRepository([
      new OpenAIModelRepository(),
      new MockModelRepository()
    ]),
    new BrowserSessionStorageService()
  );
}
