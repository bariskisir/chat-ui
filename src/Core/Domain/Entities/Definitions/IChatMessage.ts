import { ChatRole } from '../../Enums/ChatRole';
import { ModelIdentifier } from '../../Enums/ModelIdentifier';

export interface IChatMessage
{
  Id: string;
  Role: ChatRole;
  Content: string;
  CreatedAt: number;
  Model?: ModelIdentifier;
  AppendContent(chunk: string): void;
}
