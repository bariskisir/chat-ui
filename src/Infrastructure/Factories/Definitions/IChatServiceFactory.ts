import { IChatService } from '../../../Application/Contracts/IChatService';
import { ServiceProviderType } from '../../../Core/Domain/Enums/ServiceProviderType';

export interface IChatServiceFactory
{
  CreateChatService(providerType: ServiceProviderType): IChatService;
}
