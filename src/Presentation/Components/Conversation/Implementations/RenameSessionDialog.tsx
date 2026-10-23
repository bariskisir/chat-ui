import { FC, useState, useEffect, useRef, KeyboardEvent } from 'react';
import { IRenameSessionDialogProps } from '../Definitions/IRenameSessionDialogProps';

export const RenameSessionDialog: FC<IRenameSessionDialogProps> = ({
  isOpen,
  currentTitle,
  onSave,
  onClose
}) =>
{
  const [title, setTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() =>
  {
    if (isOpen)
    {
      setTitle(currentTitle);
      setTimeout(() =>
      {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentTitle]);

  if (!isOpen)
  {
    return null;
  }

  const handleSave = () =>
  {
    const trimmed = title.trim();
    if (trimmed)
    {
      onSave(trimmed);
    }
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) =>
  {
    if (e.key === 'Enter')
    {
      e.preventDefault();
      handleSave();
    }
    else if (e.key === 'Escape')
    {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="cui-dialog-backdrop" onClick={onClose}>
      <div
        className="cui-dialog-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-chat-title"
      >
        <h3 id="rename-chat-title" className="cui-dialog-title">Rename Chat</h3>

        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="cui-dialog-input"
          placeholder="Enter chat title..."
        />

        <div className="cui-dialog-actions">
          <button
            type="button"
            onClick={onClose}
            className="cui-dialog-button cui-dialog-button--secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="cui-dialog-button cui-dialog-button--primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
