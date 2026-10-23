import { FC, useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import clsx from 'clsx';
import { ArrowUp, Square } from 'lucide-react';
import { IPromptComposerProps } from '../Definitions/IPromptComposerProps';
import { UseChat } from '../../../Hooks/UseChat';

export const PromptComposer: FC<IPromptComposerProps> = ({
  className,
  placeholder = 'Ask anything...',
  isCentered = false
}) =>
{
  const { SendMessage, StopGenerating, IsGenerating } = UseChat();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() =>
  {
    if (textareaRef.current)
    {
      textareaRef.current.focus();
    }
  }, [isCentered]);

  const adjustHeight = () =>
  {
    const textarea = textareaRef.current;
    if (!textarea)
    {
      return;
    }
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  useEffect(() =>
  {
    adjustHeight();
  }, [content]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
  {
    setContent(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) =>
  {
    if (e.key === 'Enter' && !e.shiftKey)
    {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () =>
  {
    if (IsGenerating)
    {
      StopGenerating();
      return;
    }

    const trimmed = content.trim();
    if (!trimmed)
    {
      return;
    }

    setContent('');
    if (textareaRef.current)
    {
      textareaRef.current.style.height = 'auto';
    }
    void SendMessage(trimmed);
  };

  const canSubmit = content.trim().length > 0 || IsGenerating;

  return (
    <div
      className={clsx(
        isCentered ? 'cui-agent-welcome-composer-wrapper' : 'cui-agent-thread-composer',
        className
      )}
    >
      <div
        className={clsx(
          isCentered
            ? 'cui-agent-desktop-welcome-composer'
            : 'cui-agent-thread-composer__input-wrapper'
        )}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={clsx(
            isCentered
              ? 'cui-agent-desktop-welcome-composer__input'
              : 'cui-agent-thread-composer__input'
          )}
        />

        <div
          className={clsx(
            isCentered
              ? 'cui-agent-desktop-welcome-composer__action-bar'
              : 'cui-agent-thread-composer__action-bar'
          )}
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label={IsGenerating ? 'Stop generating' : 'Send prompt'}
            className={clsx(
              isCentered
                ? 'cui-agent-desktop-welcome-composer__submit-button'
                : 'cui-agent-thread-composer__submit-button'
            )}
          >
            {IsGenerating ? (
              <Square size={14} fill="currentColor" />
            ) : (
              <ArrowUp size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
