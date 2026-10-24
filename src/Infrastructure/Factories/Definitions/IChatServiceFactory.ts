import { IChatService } from '../../../Application/Contracts/IChatService';
import { ServiceProviderType } from '../../../Core/Domain/Enums/ServiceProviderType';
import { ChatServiceCreator } from './ChatServiceCreator';

export interface IChatServiceFactory
{
  Register(providerType: ServiceProviderType, creator: ChatServiceCreator): void;
  CreateChatService(providerType: ServiceProviderType): IChatService;
}
