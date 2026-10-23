import { FC, useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import clsx from 'clsx';
import { ArrowUp, Square, Paperclip, Eraser, MessageSquarePlus } from 'lucide-react';
import { IPromptComposerProps } from '../Definitions/IPromptComposerProps';
import { UseChat } from '../../../Hooks/UseChat';
import { AttachmentChip } from '../../Common/Implementations/AttachmentChip';
import { ReasoningControl } from './ReasoningControl';
import { WebSearchControl } from './WebSearchControl';
import { ModelSelector } from './ModelSelector';
import { BrowserTextAttachmentReader } from '../../../../Infrastructure/Services/BrowserTextAttachmentReader';
import { IChatAttachment } from '../../../../Core/Domain/Entities/Definitions/IChatAttachment';

const AttachmentAccept = [
  '.txt', '.md', '.markdown', '.json', '.jsonc', '.js', '.jsx', '.ts', '.tsx',
  '.css', '.scss', '.sass', '.less', '.html', '.htm', '.xml', '.svg', '.yml',
  '.yaml', '.toml', '.ini', '.cfg', '.conf', '.env', '.csv', '.tsv', '.log',
  '.py', '.java', '.kt', '.kts', '.go', '.rs', '.c', '.h', '.cpp', '.hpp', '.cc',
  '.cs', '.php', '.rb', '.swift', '.sh', '.bash', '.zsh', '.ps1', '.sql',
  '.graphql', '.gql', '.vue', '.svelte', '.astro', 'text/*'
].join(',');

const attachmentReader = new BrowserTextAttachmentReader();

export const PromptComposer: FC<IPromptComposerProps> = ({
  className,
  placeholder = 'Ask anything...',
  isCentered = false
}) =>
{
  const {
    ActiveSession,
    SendMessage,
    StopGenerating,
    IsGenerating,
    ReasoningEffort,
    WebSearchMode,
    CanUseReasoning,
    CanUseWebSearch,
    SetReasoningEffort,
    SetWebSearchMode,
    ClearCurrentSession,
    CreateNewSession
  } = UseChat();

  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<IChatAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isReadingAttachments, setIsReadingAttachments] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const computedStyle = window.getComputedStyle(textarea);
    const maxHeight = Number.parseFloat(computedStyle.maxHeight);
    const scrollHeight = textarea.scrollHeight;
    const nextHeight = Number.isFinite(maxHeight)
      ? Math.min(scrollHeight, maxHeight)
      : scrollHeight;

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = Number.isFinite(maxHeight) && scrollHeight > maxHeight
      ? 'auto'
      : 'hidden';
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

    const outgoingAttachments = attachments;

    setContent('');
    setAttachments([]);
    setAttachmentError(null);

    if (textareaRef.current)
    {
      textareaRef.current.style.height = 'auto';
    }

    void SendMessage(trimmed, outgoingAttachments);
  };

  const handleAttachClick = () =>
  {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) =>
  {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';

    if (files.length === 0)
    {
      return;
    }

    setAttachmentError(null);

    const remainingSlots = BrowserTextAttachmentReader.MaxAttachmentCount - attachments.length;
    if (remainingSlots <= 0)
    {
      setAttachmentError(
        `You can attach up to ${BrowserTextAttachmentReader.MaxAttachmentCount} files.`
      );
      return;
    }

    const filesToRead = files.slice(0, remainingSlots);
    const errors: string[] = [];

    if (files.length > remainingSlots)
    {
      const skippedCount = files.length - remainingSlots;
      errors.push(
        skippedCount === 1
          ? `1 file was skipped. Attachments are limited to ${BrowserTextAttachmentReader.MaxAttachmentCount} files.`
          : `${skippedCount} files were skipped. Attachments are limited to ${BrowserTextAttachmentReader.MaxAttachmentCount} files.`
      );
    }

    setIsReadingAttachments(true);

    const acceptedAttachments: IChatAttachment[] = [];
    for (const file of filesToRead)
    {
      try
      {
        acceptedAttachments.push(await attachmentReader.ReadAsync(file));
      }
      catch (error)
      {
        const message = error instanceof Error ? error.message : 'The file could not be read.';
        errors.push(`${file.name}: ${message}`);
      }
    }

    setIsReadingAttachments(false);

    if (acceptedAttachments.length > 0)
    {
      setAttachments((prev) =>
      {
        return [...prev, ...acceptedAttachments]
          .slice(0, BrowserTextAttachmentReader.MaxAttachmentCount);
      });
    }

    if (errors.length > 0)
    {
      setAttachmentError(errors.join(' '));
    }
  };

  const handleRemoveAttachment = (id: string) =>
  {
    setAttachments((prev) => prev.filter((attachment) => attachment.Id !== id));
    setAttachmentError(null);
  };

  const resetDraft = () =>
  {
    setContent('');
    setAttachments([]);
    setAttachmentError(null);

    if (textareaRef.current)
    {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleClearChat = () =>
  {
    resetDraft();
    ClearCurrentSession();
  };

  const handleNewChat = () =>
  {
    resetDraft();
    CreateNewSession();
  };

  const canSubmit = content.trim().length > 0 || IsGenerating;
  const canAttachMore = attachments.length < BrowserTextAttachmentReader.MaxAttachmentCount;
  const canClear = ActiveSession !== null;

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
        {attachments.length > 0 && (
          <div className="cui-agent-composer-attachments">
            {attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.Id}
                attachment={attachment}
                onRemove={() => handleRemoveAttachment(attachment.Id)}
              />
            ))}
          </div>
        )}

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

        {attachmentError && (
          <div className="cui-agent-composer-error" role="alert">
            {attachmentError}
          </div>
        )}

        <div className="cui-agent-composer-toolbar">
          <div className="cui-agent-composer-toolbar__tools">
            <button
              type="button"
              onClick={handleNewChat}
              className="cui-agent-composer-tool cui-agent-composer-tool--icon"
              title="New chat"
              aria-label="New chat"
            >
              <MessageSquarePlus size={16} strokeWidth={2} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={AttachmentAccept}
              onChange={(event) => void handleFilesSelected(event)}
              className="cui-agent-composer-file-input"
              aria-hidden="true"
              tabIndex={-1}
            />

            <button
              type="button"
              onClick={handleAttachClick}
              disabled={isReadingAttachments || !canAttachMore}
              className="cui-agent-composer-tool cui-agent-composer-tool--icon"
              title={isReadingAttachments ? 'Reading attachments...' : 'Attach text or code files'}
              aria-label="Attach text or code files"
            >
              <Paperclip size={16} strokeWidth={2} />
            </button>

            <ReasoningControl
              value={ReasoningEffort}
              disabled={!CanUseReasoning}
              onChange={SetReasoningEffort}
            />

            <WebSearchControl
              value={WebSearchMode}
              disabled={!CanUseWebSearch}
              onChange={SetWebSearchMode}
            />

            <button
              type="button"
              onClick={handleClearChat}
              disabled={!canClear}
              className="cui-agent-composer-tool cui-agent-composer-tool--icon cui-agent-composer-tool--destructive"
              title={canClear ? 'Clear this chat' : 'There is no chat to clear'}
              aria-label={canClear ? 'Clear this chat' : 'There is no chat to clear'}
            >
              <Eraser size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="cui-agent-composer-toolbar__actions">
            <ModelSelector className="cui-agent-composer-toolbar__model" />

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
    </div>
  );
};
