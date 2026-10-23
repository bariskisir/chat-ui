import { IConversationRepository } from '../../Application/Contracts/IConversationRepository';
import { IStorageService } from '../../Application/Contracts/IStorageService';
import { IConversationSession } from '../../Core/Domain/Entities/Definitions/IConversationSession';
import { ConversationSession } from '../../Core/Domain/Entities/Implementations/ConversationSession';
import { ChatMessage } from '../../Core/Domain/Entities/Implementations/ChatMessage';
import { IStoredSessionDto } from '../DTOs/IStoredSessionDto';

export class BrowserConversationRepository implements IConversationRepository
{
  private static readonly StorageKey = 'cui_conversations_v1';
  private readonly _storageService: IStorageService;

  public constructor(storageService: IStorageService)
  {
    this._storageService = storageService;
  }

  public GetAllSessions(): IConversationSession[]
  {
    const rawSessions = this._storageService.GetItem<IStoredSessionDto[]>(BrowserConversationRepository.StorageKey);
    if (!rawSessions || !Array.isArray(rawSessions))
    {
      return [];
    }

    return rawSessions
      .map((dto) =>
      {
        const messages = (dto.Messages || []).map((m) =>
          new ChatMessage(m.Id, m.Role, m.Content, m.CreatedAt, m.Model)
        );
        return new ConversationSession(
          dto.Id,
          dto.Title,
          dto.CreatedAt,
          dto.UpdatedAt,
          messages,
          dto.Model
        );
      })
      .sort((a, b) => b.UpdatedAt - a.UpdatedAt);
  }

  public GetSessionById(id: string): IConversationSession | undefined
  {
    return this.GetAllSessions().find((s) => s.Id === id);
  }

  public SaveSession(session: IConversationSession): void
  {
    const all = this.GetAllSessions();
    const existingIndex = all.findIndex((s) => s.Id === session.Id);

    if (existingIndex >= 0)
    {
      all[existingIndex] = session;
    }
    else
    {
      all.unshift(session);
    }

    this._storageService.SetItem(BrowserConversationRepository.StorageKey, all);
  }

  public DeleteSession(id: string): void
  {
    const all = this.GetAllSessions().filter((s) => s.Id !== id);
    this._storageService.SetItem(BrowserConversationRepository.StorageKey, all);
  }

  public ClearAllSessions(): void
  {
    this._storageService.RemoveItem(BrowserConversationRepository.StorageKey);
  }
}
