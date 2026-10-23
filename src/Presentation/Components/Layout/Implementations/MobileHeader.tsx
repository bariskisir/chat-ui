import { FC } from 'react';
import clsx from 'clsx';
import { PanelLeft, SquarePen } from 'lucide-react';
import { IMobileHeaderProps } from '../Definitions/IMobileHeaderProps';
import { IconButton } from '../../Common/Implementations/IconButton';

export const MobileHeader: FC<IMobileHeaderProps> = ({
  className,
  onToggleSidebar,
  onNewChat
}) =>
{
  return (
    <header className={clsx('cui-agent-mobile-header', className)}>
      <IconButton
        onClick={onToggleSidebar}
        title="Open sidebar"
        ariaLabel="Open sidebar"
        className="cui-agent-mobile-header__toggle"
      >
        <PanelLeft size={18} strokeWidth={2} />
      </IconButton>

      <div className="cui-agent-mobile-header__logo-container">
        <span className="cui-agent-mobile-header__agent-name">Chat UI</span>
      </div>

      <div className="cui-agent-mobile-header__actions">
        <IconButton
          onClick={onNewChat}
          title="New chat"
          ariaLabel="New chat"
          className="cui-agent-mobile-header__new-chat"
        >
          <SquarePen size={16} strokeWidth={2} />
        </IconButton>
      </div>
    </header>
  );
};
