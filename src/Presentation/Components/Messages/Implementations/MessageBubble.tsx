import { FC, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { IMessageBubbleProps } from '../Definitions/IMessageBubbleProps';
import { ChatRole } from '../../../../Core/Domain/Enums/ChatRole';
import { ChatBrandIcon } from '../../Common/Implementations/ChatBrandIcon';
import { TypingIndicator } from './TypingIndicator';
import { IconButton } from '../../Common/Implementations/IconButton';

export const MessageBubble: FC<IMessageBubbleProps> = ({
  message,
  isLatestAssistant,
  isStreaming
}) =>
{
  const [copied, setCopied] = useState(false);
  const isUser = message.Role === ChatRole.User;

  const handleCopy = async () =>
  {
    if (!message.Content)
    {
      return;
    }
    await navigator.clipboard.writeText(message.Content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser)
  {
    return (
      <div className="cui-agent-thread-message-user">
        <div className="cui-agent-thread-message-user__content">
          {message.Content}
        </div>
      </div>
    );
  }

  const showIndicator = isLatestAssistant && isStreaming && !message.Content;

  return (
    <div className="cui-agent-thread-message-assistant">
      <div className="cui-agent-thread-message-assistant__avatar">
        <ChatBrandIcon size={16} />
      </div>

      <div className="cui-agent-thread-message-assistant__content">
        <div className="cui-agent-thread-message-assistant__text">
          {showIndicator ? (
            <TypingIndicator />
          ) : (
            message.Content
          )}
        </div>

        {message.Content && !showIndicator && (
          <div className="cui-agent-thread-message-assistant__footer">
            <IconButton
              size="small"
              onClick={handleCopy}
              title={copied ? 'Copied to clipboard' : 'Copy message'}
              ariaLabel={copied ? 'Copied to clipboard' : 'Copy message'}
            >
              {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
};
