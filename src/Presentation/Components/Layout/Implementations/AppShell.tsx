import { FC, useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { IAppShellProps } from '../Definitions/IAppShellProps';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileHeader } from './MobileHeader';
import { UseChat } from '../../../Hooks/UseChat';
import { UseAutoScroll } from '../../../Hooks/UseAutoScroll';
import { ChatEmptyView } from '../../Welcome/Implementations/ChatEmptyView';
import { MessageList } from '../../Messages/Implementations/MessageList';
import { PromptComposer } from '../../Composer/Implementations/PromptComposer';

const SidebarCollapsedStorageKey = 'cui_sidebar_collapsed_v1';

export const AppShell: FC<IAppShellProps> = ({ className }) =>
{
  const { Messages, IsGenerating, CreateNewSession } = UseChat();

  const [isMobile, setIsMobile] = useState<boolean>(() =>
  {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() =>
  {
    if (typeof window !== 'undefined' && window.innerWidth < 768)
    {
      return true;
    }
    const stored = localStorage.getItem(SidebarCollapsedStorageKey);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() =>
  {
    const handleResize = () =>
    {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile)
      {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () =>
    {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { ContainerRef } = UseAutoScroll(Messages, IsGenerating);

  const handleToggleSidebar = useCallback(() =>
  {
    setIsSidebarCollapsed((prev) =>
    {
      const next = !prev;
      if (!isMobile)
      {
        localStorage.setItem(SidebarCollapsedStorageKey, String(next));
      }
      return next;
    });
  }, [isMobile]);

  const handleOpenHistory = useCallback(() =>
  {
    setIsSidebarCollapsed(false);
  }, []);

  const handleMobileNewChat = useCallback(() =>
  {
    CreateNewSession();
    if (isMobile && !isSidebarCollapsed)
    {
      setIsSidebarCollapsed(true);
    }
  }, [CreateNewSession, isMobile, isSidebarCollapsed]);

  const hasMessages = Messages.length > 0;

  return (
    <div
      className={clsx(
        'cui-agent-container',
        isMobile && 'cui-agent-container--mobile',
        className
      )}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
        onToggleCollapse={handleToggleSidebar}
        onSelectHistory={handleOpenHistory}
      />

      <main className="cui-agent-thread-container">
        {isMobile ? (
          <MobileHeader
            onToggleSidebar={handleToggleSidebar}
            onNewChat={handleMobileNewChat}
          />
        ) : (
          <TopHeader />
        )}

        <div className="cui-agent-thread-scrollable" ref={ContainerRef}>
          {hasMessages ? (
            <MessageList messages={Messages} isGenerating={IsGenerating} />
          ) : (
            <ChatEmptyView isMobile={isMobile} />
          )}
        </div>

        {(hasMessages || isMobile) && <PromptComposer />}
      </main>
    </div>
  );
};
