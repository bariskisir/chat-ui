import { IChatMessage } from '../Definitions/IChatMessage';
import { ChatRole } from '../../Enums/ChatRole';
import { ModelIdentifier } from '../../Enums/ModelIdentifier';

export class ChatMessage implements IChatMessage
{
  public readonly Id: string;
  public readonly Role: ChatRole;
  public Content: string;
  public readonly CreatedAt: number;
  public readonly Model?: ModelIdentifier;

  public constructor(
    id: string,
    role: ChatRole,
    content: string,
    createdAt: number,
    model?: ModelIdentifier
  )
  {
    this.Id = id;
    this.Role = role;
    this.Content = content;
    this.CreatedAt = createdAt;
    this.Model = model;
  }

  public static CreateUserMessage(content: string, model: ModelIdentifier): ChatMessage
  {
    const id = 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
    return new ChatMessage(id, ChatRole.User, content, Date.now(), model);
  }

  public static CreateAssistantMessage(model: ModelIdentifier, initialContent = ''): ChatMessage
  {
    const id = 'msg-' + (Date.now() + 1).toString(36) + '-' + Math.random().toString(36).substring(2, 7);
    return new ChatMessage(id, ChatRole.Assistant, initialContent, Date.now(), model);
  }

  public AppendContent(chunk: string): void
  {
    this.Content += chunk;
  }
}
