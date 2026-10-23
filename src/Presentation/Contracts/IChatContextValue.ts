import { IConversationSession } from '../../Core/Domain/Entities/Definitions/IConversationSession';
import { IChatMessage } from '../../Core/Domain/Entities/Definitions/IChatMessage';
import { ChatStatus } from '../../Core/Domain/Enums/ChatStatus';

export interface IChatContextValue
{
  Sessions: IConversationSession[];
  ActiveSession: IConversationSession | null;
  Messages: IChatMessage[];
  Status: ChatStatus;
  IsGenerating: boolean;
  SendMessage(prompt: string): Promise<void>;
  StopGenerating(): void;
  CreateNewSession(): void;
  SelectSession(id: string): void;
  DeleteSession(id: string): void;
  RenameSession(id: string, newTitle: string): void;
  ClearAllSessions(): void;
}
