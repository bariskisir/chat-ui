import { FC, useState, useRef, useEffect, MouseEvent } from 'react';
import clsx from 'clsx';
import { MessageCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ISessionItemProps } from '../Definitions/ISessionItemProps';
import { IconButton } from '../../Common/Implementations/IconButton';
import { RenameSessionDialog } from './RenameSessionDialog';

export const SessionItem: FC<ISessionItemProps> = ({
  session,
  isSelected,
  onSelect,
  onDelete,
  onRename
}) =>
{
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() =>
  {
    const handleClickOutside = (event: globalThis.MouseEvent) =>
    {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
      {
        setIsActionsOpen(false);
      }
    };

    if (isActionsOpen)
    {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () =>
    {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionsOpen]);

  const handleToggleActions = (e: MouseEvent) =>
  {
    e.stopPropagation();
    setIsActionsOpen((prev) => !prev);
  };

  const handleStartRename = (e: MouseEvent) =>
  {
    e.stopPropagation();
    setIsActionsOpen(false);
    setIsRenameDialogOpen(true);
  };

  const handleDelete = (e: MouseEvent) =>
  {
    e.stopPropagation();
    setIsActionsOpen(false);
    onDelete(session.Id);
  };

  const handleSaveRename = (newTitle: string) =>
  {
    onRename(session.Id, newTitle);
  };

  return (
    <>
      <div
        className={clsx(
          'cui-agent-thread-button',
          isSelected && 'cui-agent-thread-button--selected',
          isActionsOpen && 'cui-agent-thread-button--actions-open'
        )}
      >
        <button
          type="button"
          onClick={() => onSelect(session.Id)}
          className="cui-agent-thread-button-title"
        >
          <MessageCircle size={14} className="cui-agent-thread-button-icon" />
          <span className="cui-agent-thread-button-label">{session.Title}</span>
        </button>

        <IconButton
          size="small"
          onClick={handleToggleActions}
          title="Thread actions"
          ariaLabel="Thread actions"
          className="cui-agent-thread-button-dropdown-trigger"
        >
          <MoreHorizontal size={14} strokeWidth={2} />
        </IconButton>

        {isActionsOpen && (
          <div className="cui-agent-thread-dropdown-menu" ref={menuRef}>
            <button
              type="button"
              onClick={handleStartRename}
              className="cui-agent-thread-dropdown-item"
            >
              <Pencil size={13} strokeWidth={2} />
              <span>Rename</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="cui-agent-thread-dropdown-item cui-agent-thread-dropdown-item--destructive"
            >
              <Trash2 size={13} strokeWidth={2} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      <RenameSessionDialog
        isOpen={isRenameDialogOpen}
        currentTitle={session.Title}
        onSave={handleSaveRename}
        onClose={() => setIsRenameDialogOpen(false)}
      />
    </>
  );
};
