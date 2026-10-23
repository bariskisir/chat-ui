import { IChatMessage } from '../Definitions/IChatMessage';
import { IChatAttachment } from '../Definitions/IChatAttachment';
import { IChatSearchState } from '../../DTOs/IChatSearchState';
import { ChatRole } from '../../Enums/ChatRole';
import { ModelIdentifier } from '../../Enums/ModelIdentifier';

export class ChatMessage implements IChatMessage
{
  public readonly Id: string;
  public readonly Role: ChatRole;
  public Content: string;
  public Reasoning: string;
  public Error?: string;
  public ReasoningStartedAt?: number;
  public Search?: IChatSearchState;
  public readonly CreatedAt: number;
  public readonly Model?: ModelIdentifier;
  public readonly Attachments: IChatAttachment[];

  public constructor(
    id: string,
    role: ChatRole,
    content: string,
    createdAt: number,
    model?: ModelIdentifier,
    attachments: IChatAttachment[] = [],
    reasoning = '',
    reasoningStartedAt?: number,
    search?: IChatSearchState,
    error?: string
  )
  {
    this.Id = id;
    this.Role = role;
    this.Content = content;
    this.Reasoning = reasoning;
    this.Error = error;
    this.ReasoningStartedAt = reasoningStartedAt;
    this.Search = ChatMessage.CloneSearch(search);
    this.CreatedAt = createdAt;
    this.Model = model;
    this.Attachments = attachments;
  }

  public static CreateUserMessage(
    content: string,
    model: ModelIdentifier,
    attachments: IChatAttachment[] = []
  ): ChatMessage
  {
    const id = 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
    return new ChatMessage(id, ChatRole.User, content, Date.now(), model, attachments);
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

  public AppendReasoning(chunk: string): void
  {
    if (!chunk)
    {
      return;
    }

    this.ReasoningStartedAt ??= Date.now();
    this.Reasoning += chunk;
  }

  public ApplyError(message: string): void
  {
    const trimmed = message.trim();
    this.Error = trimmed || undefined;
  }

  public ApplySearchState(search: IChatSearchState): void
  {
    this.Search = ChatMessage.CloneSearch(search);
  }

  private static CloneSearch(search?: IChatSearchState): IChatSearchState | undefined
  {
    if (!search)
    {
      return undefined;
    }

    return {
      Engine: search.Engine,
      Status: search.Status,
      Citations: search.Citations.map((citation) => ({ ...citation }))
    };
  }
}
