import { FC, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { IMessageBubbleProps } from '../Definitions/IMessageBubbleProps';
import { ChatRole } from '../../../../Core/Domain/Enums/ChatRole';
import { AttachmentChip } from '../../Common/Implementations/AttachmentChip';
import { TypingIndicator } from './TypingIndicator';
import { ThinkingBlock } from './ThinkingBlock';
import { SearchBlock } from './SearchBlock';
import { IconButton } from '../../Common/Implementations/IconButton';
import { MarkdownContent } from '../../Common/Implementations/MarkdownContent';

export const MessageBubble: FC<IMessageBubbleProps> = ({
  message,
  isLatestAssistant,
  isStreaming
}) =>
{
  const [copied, setCopied] = useState(false);
  const isUser = message.Role === ChatRole.User;
  const copyText = [message.Content, message.Error].filter(Boolean).join('\n\n');

  const handleCopy = async () =>
  {
    if (!copyText)
    {
      return;
    }
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser)
  {
    const attachments = message.Attachments ?? [];

    return (
      <div className="cui-agent-thread-message-user">
        <div className="cui-agent-thread-message-user__content">
          {attachments.length > 0 && (
            <div className="cui-agent-thread-message-user__attachments">
              {attachments.map((attachment) => (
                <AttachmentChip
                  key={attachment.Id}
                  attachment={attachment}
                  tone="inverted"
                />
              ))}
            </div>
          )}

          <div className="cui-agent-thread-message-user__text">
            {message.Content}
          </div>
        </div>
      </div>
    );
  }

  const showIndicator = isLatestAssistant
    && isStreaming
    && !message.Content
    && !message.Reasoning
    && !message.Search
    && !message.Error;
  const isReasoningStreaming = Boolean(
    isLatestAssistant
    && isStreaming
    && message.Reasoning
    && !message.Content
  );

  return (
    <div className="cui-agent-thread-message-assistant">
      <div className="cui-agent-thread-message-assistant__content">
        {message.Reasoning && (
          <ThinkingBlock
            content={message.Reasoning}
            streaming={isReasoningStreaming}
          />
        )}

        {message.Search && <SearchBlock search={message.Search} />}

        <div className="cui-agent-thread-message-assistant__text">
          {showIndicator ? (
            <TypingIndicator />
          ) : (
            <MarkdownContent
              content={message.Content}
              citations={message.Search?.Citations}
            />
          )}
        </div>

        {message.Error && (
          <div className="cui-agent-thread-message-assistant__error" role="alert">
            <pre>{message.Error}</pre>
          </div>
        )}

        {(message.Content || message.Error) && !showIndicator && (
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
