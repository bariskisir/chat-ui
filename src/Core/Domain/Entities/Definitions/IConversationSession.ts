import { IChatMessage } from './IChatMessage';
import { ModelIdentifier } from '../../Enums/ModelIdentifier';

export interface IConversationSession
{
  Id: string;
  Title: string;
  CreatedAt: number;
  UpdatedAt: number;
  Messages: IChatMessage[];
  Model: ModelIdentifier;
  AddMessage(message: IChatMessage): void;
  Rename(newTitle: string): void;
}
