import { IConversationSession } from '../Definitions/IConversationSession';
import { IChatMessage } from '../Definitions/IChatMessage';
import { ModelIdentifier } from '../../Enums/ModelIdentifier';

export class ConversationSession implements IConversationSession
{
  public readonly Id: string;
  public Title: string;
  public readonly CreatedAt: number;
  public UpdatedAt: number;
  public Messages: IChatMessage[];
  public Model: ModelIdentifier;

  public constructor(
    id: string,
    title: string,
    createdAt: number,
    updatedAt: number,
    messages: IChatMessage[],
    model: ModelIdentifier
  )
  {
    this.Id = id;
    this.Title = title;
    this.CreatedAt = createdAt;
    this.UpdatedAt = updatedAt;
    this.Messages = messages;
    this.Model = model;
  }

  public static CreateNew(model: ModelIdentifier, title = 'New Conversation'): ConversationSession
  {
    const id = 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
    return new ConversationSession(id, title, Date.now(), Date.now(), [], model);
  }

  public AddMessage(message: IChatMessage): void
  {
    this.Messages.push(message);
    this.UpdatedAt = Date.now();
  }

  public Rename(newTitle: string): void
  {
    this.Title = newTitle.trim();
    this.UpdatedAt = Date.now();
  }
}
