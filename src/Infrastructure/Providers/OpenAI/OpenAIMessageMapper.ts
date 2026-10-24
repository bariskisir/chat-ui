import { IChatMessage } from '../../../Core/Domain/Entities/Definitions/IChatMessage';
import { ChatRole } from '../../../Core/Domain/Enums/ChatRole';
import { IOpenAIChatMessageDto, OpenAIChatRole } from './DTOs/IOpenAIChatMessageDto';

export class OpenAIMessageMapper
{
  public Map(history: IChatMessage[], prompt: string): IOpenAIChatMessageDto[]
  {
    const messages = history
      .map<IOpenAIChatMessageDto | null>((message) =>
      {
        const content = OpenAIMessageMapper.BuildContent(message);
        if (!content)
        {
          return null;
        }

        return {
          role: this.MapRole(message.Role),
          content
        };
      })
      .filter((message): message is IOpenAIChatMessageDto => message !== null);

    const trimmedPrompt = prompt.trim();
    const lastMessage = messages[messages.length - 1];

    if (
      trimmedPrompt.length > 0
      && (!lastMessage || lastMessage.role !== 'user' || !lastMessage.content.startsWith(trimmedPrompt))
    )
    {
      messages.push({
        role: 'user',
        content: trimmedPrompt
      });
    }

    return messages;
  }

  private static BuildContent(message: IChatMessage): string
  {
    const sections: string[] = [];
    const text = message.Content.trim();
    if (text)
    {
      sections.push(text);
    }

    for (const attachment of message.Attachments ?? [])
    {
      const attachmentText = attachment.Content.trim();
      if (!attachmentText)
      {
        continue;
      }

      sections.push(`--- Attached file: ${attachment.Name} ---\n${attachmentText}`);
    }

    return sections.join('\n\n');
  }

  private MapRole(role: ChatRole): OpenAIChatRole
  {
    switch (role)
    {
      case ChatRole.Assistant:
        return 'assistant';
      case ChatRole.System:
        return 'system';
      case ChatRole.User:
      default:
        return 'user';
    }
  }
}
