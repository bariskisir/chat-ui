import { ReactNode } from 'react';
import { IChatService } from '../../../Application/Contracts/IChatService';
import { IConversationRepository } from '../../../Application/Contracts/IConversationRepository';

export interface IChatProviderProps
{
  children: ReactNode;
  chatService?: IChatService;
  repository?: IConversationRepository;
}
