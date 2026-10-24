import { FC, useState, useRef, useEffect, MouseEvent } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ITopHeaderProps } from '../Definitions/ITopHeaderProps';
import { UseChat } from '../../../Hooks/UseChat';
import { IconButton } from '../../Common/Implementations/IconButton';
import { RenameSessionDialog } from '../../Conversation/Implementations/RenameSessionDialog';

export const TopHeader: FC<ITopHeaderProps> = () =>
{
  const { ActiveSession, DeleteSession, RenameSession } = UseChat();
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
    if (ActiveSession)
    {
      DeleteSession(ActiveSession.Id);
    }
  };

  const handleSaveRename = (newTitle: string) =>
  {
    if (ActiveSession)
    {
      RenameSession(ActiveSession.Id, newTitle);
    }
  };

  return (
    <>
      <header className="cui-agent-thread-header">
        <div className="cui-agent-thread-header__end">
          {ActiveSession && (
            <div style={{ position: 'relative' }}>
              <IconButton
                size="small"
                onClick={handleToggleActions}
                title="Chat actions"
                ariaLabel="Chat actions"
                className="cui-agent-thread-header__actions-trigger"
              >
                <MoreHorizontal size={16} strokeWidth={2} />
              </IconButton>

              {isActionsOpen && (
                <div className="cui-agent-thread-dropdown-menu cui-agent-thread-dropdown-menu--end" ref={menuRef}>
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
          )}
        </div>
      </header>

      {ActiveSession && (
        <RenameSessionDialog
          isOpen={isRenameDialogOpen}
          currentTitle={ActiveSession.Title}
          onSave={handleSaveRename}
          onClose={() => setIsRenameDialogOpen(false)}
        />
      )}
    </>
  );
};
