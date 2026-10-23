import { FC } from 'react';
import clsx from 'clsx';
import { PanelLeft, SquarePen, Clock } from 'lucide-react';
import { ISidebarProps } from '../Definitions/ISidebarProps';
import { UseChat } from '../../../Hooks/UseChat';
import { IconButton } from '../../Common/Implementations/IconButton';
import { SessionList } from '../../Conversation/Implementations/SessionList';
import { ThemeToggle } from '../../Common/Implementations/ThemeToggle';

export const Sidebar: FC<ISidebarProps> = ({
  isCollapsed,
  isMobile,
  onToggleCollapse,
  onSelectHistory
}) =>
{
  const { CreateNewSession, ActiveSession } = UseChat();
  const isNewChatSelected = ActiveSession === null;

  const handleNewChat = () =>
  {
    CreateNewSession();
    if (isMobile)
    {
      onToggleCollapse();
    }
  };

  return (
    <>
      {isMobile && !isCollapsed && (
        <div
          className="cui-agent-sidebar-overlay"
          onClick={onToggleCollapse}
          aria-hidden="true"
        />
      )}

      <aside
        data-sidebar-visual-state={isCollapsed ? 'collapsed' : 'expanded'}
        className={clsx(
          'cui-agent-sidebar-container',
          isCollapsed && 'cui-agent-sidebar-container--collapsed',
          isMobile && 'cui-agent-sidebar-container--mobile'
        )}
      >
        <div className="cui-agent-sidebar-actions">
          <div className="cui-agent-sidebar-header">
            <div className="cui-agent-sidebar-header__top-row">
              {!isCollapsed ? (
                <>
                  <div className="cui-agent-sidebar-header__agent-name">Chat UI</div>
                  <IconButton
                    onClick={onToggleCollapse}
                    title="Collapse sidebar"
                    ariaLabel="Collapse sidebar"
                    className="cui-agent-sidebar-header__toggle-button"
                  >
                    <PanelLeft size={16} strokeWidth={2} />
                  </IconButton>
                </>
              ) : (
                <IconButton
                  onClick={onToggleCollapse}
                  title="Open sidebar"
                  ariaLabel="Open sidebar"
                  className="cui-agent-rail-button"
                >
                  <PanelLeft size={16} strokeWidth={2} />
                </IconButton>
              )}
            </div>
          </div>

          <div className="cui-agent-sidebar-primary-actions">
            <button
              type="button"
              onClick={handleNewChat}
              className={clsx(
                'cui-agent-new-chat-button',
                isCollapsed && !isMobile && 'cui-agent-new-chat-button--collapsed',
                isNewChatSelected && 'cui-agent-new-chat-button--selected'
              )}
              title="New Chat"
              aria-label="New Chat"
            >
              <div className="cui-agent-new-chat-button__icon">
                <SquarePen size={14} strokeWidth={2} />
              </div>
              {(!isCollapsed || isMobile) && (
                <div className="cui-agent-new-chat-button__label">New Chat</div>
              )}
            </button>

            {isCollapsed && !isMobile && (
              <button
                type="button"
                onClick={onSelectHistory}
                className="cui-agent-rail-button"
                title="History"
                aria-label="History"
              >
                <Clock size={15} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {(!isCollapsed || isMobile) && (
          <div className="cui-agent-sidebar-content">
            <SessionList />
          </div>
        )}

        <div className="cui-agent-sidebar-footer">
          <ThemeToggle />
        </div>

        <div aria-hidden="true" className="cui-agent-sidebar-resize-edge" />
      </aside>
    </>
  );
};
