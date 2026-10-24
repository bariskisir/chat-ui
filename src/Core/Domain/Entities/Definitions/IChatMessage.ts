import { ChatRole } from '../../Enums/ChatRole';
import { ModelIdentifier } from '../../Enums/ModelIdentifier';
import { IChatAttachment } from './IChatAttachment';
import { IChatSearchState } from '../../DTOs/IChatSearchState';

export interface IChatMessage
{
  Id: string;
  Role: ChatRole;
  Content: string;
  Reasoning: string;
  Error?: string;
  ReasoningStartedAt?: number;
  Search?: IChatSearchState;
  CreatedAt: number;
  Model?: ModelIdentifier;
  Attachments?: IChatAttachment[];
  AppendContent(chunk: string): void;
  AppendReasoning(chunk: string): void;
  ApplyError(message: string): void;
  ApplySearchState(search: IChatSearchState): void;
}
