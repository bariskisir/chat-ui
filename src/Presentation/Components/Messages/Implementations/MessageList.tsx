import { FC } from 'react';
import { IMessageListProps } from '../Definitions/IMessageListProps';
import { MessageBubble } from './MessageBubble';
import { ChatRole } from '../../../../Core/Domain/Enums/ChatRole';

export const MessageList: FC<IMessageListProps> = ({ messages, isGenerating }) =>
{
  const lastAssistantIndex = messages
    .map((m, idx) => ({ role: m.Role, idx }))
    .filter((x) => x.role === ChatRole.Assistant)
    .pop()?.idx;

  return (
    <div className="cui-agent-thread-messages">
      {messages.map((msg, index) =>
      {
        const isLatestAssistant = index === lastAssistantIndex;
        return (
          <MessageBubble
            key={msg.Id}
            message={msg}
            isLatestAssistant={isLatestAssistant}
            isStreaming={isGenerating}
          />
        );
      })}
    </div>
  );
};
