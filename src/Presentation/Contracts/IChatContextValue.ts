import { IConversationSession } from '../../Core/Domain/Entities/Definitions/IConversationSession';
import { IChatAttachment } from '../../Core/Domain/Entities/Definitions/IChatAttachment';
import { IChatMessage } from '../../Core/Domain/Entities/Definitions/IChatMessage';
import { ChatStatus } from '../../Core/Domain/Enums/ChatStatus';
import { ReasoningEffort } from '../../Core/Domain/Enums/ReasoningEffort';
import { WebSearchMode } from '../../Core/Domain/Enums/WebSearchMode';

export interface IChatContextValue
{
  Sessions: IConversationSession[];
  ActiveSession: IConversationSession | null;
  Messages: IChatMessage[];
  Status: ChatStatus;
  IsGenerating: boolean;
  ReasoningEffort: ReasoningEffort;
  WebSearchMode: WebSearchMode;
  WebSearchEnabled: boolean;
  CanUseReasoning: boolean;
  CanUseWebSearch: boolean;
  SendMessage(prompt: string, attachments?: IChatAttachment[]): Promise<void>;
  StopGenerating(sessionId?: string): void;
  CreateNewSession(): void;
  SelectSession(id: string): void;
  DeleteSession(id: string): void;
  ClearCurrentSession(): void;
  RenameSession(id: string, newTitle: string): void;
  ClearAllSessions(): void;
  SetReasoningEffort(effort: ReasoningEffort): void;
  SetWebSearchMode(mode: WebSearchMode): void;
}
