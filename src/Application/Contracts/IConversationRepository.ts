import { IConversationSession } from '../../Core/Domain/Entities/Definitions/IConversationSession';

export interface IConversationRepository
{
  GetAllSessions(): IConversationSession[];
  GetSessionById(id: string): IConversationSession | undefined;
  SaveSession(session: IConversationSession): void;
  DeleteSession(id: string): void;
  ClearAllSessions(): void;
}
