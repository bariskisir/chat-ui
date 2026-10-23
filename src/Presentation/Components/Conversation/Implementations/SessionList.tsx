import { FC, useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { Trash2 } from 'lucide-react';
import { ISessionListProps } from '../Definitions/ISessionListProps';
import { UseChat } from '../../../Hooks/UseChat';
import { IconButton } from '../../Common/Implementations/IconButton';
import { SessionItem } from './SessionItem';

export const SessionList: FC<ISessionListProps> = ({ className }) =>
{
  const {
    Sessions,
    ActiveSession,
    SelectSession,
    DeleteSession,
    RenameSession,
    ClearAllSessions
  } = UseChat();

  const [scrollMasks, setScrollMasks] = useState({ top: false, bottom: false });
  const listRef = useRef<HTMLDivElement>(null);

  const updateScrollMasks = useCallback(() =>
  {
    const list = listRef.current;
    if (!list)
    {
      return;
    }

    const maxScrollTop = list.scrollHeight - list.clientHeight;
    const nextMasks = {
      top: maxScrollTop > 0 && list.scrollTop > 1,
      bottom: maxScrollTop > 0 && list.scrollTop < maxScrollTop - 1
    };

    setScrollMasks((current) =>
      current.top === nextMasks.top && current.bottom === nextMasks.bottom ? current : nextMasks
    );
  }, []);

  useEffect(() =>
  {
    const list = listRef.current;
    if (!list)
    {
      return;
    }

    updateScrollMasks();

    const resizeObserver = new ResizeObserver(updateScrollMasks);
    resizeObserver.observe(list);
    const mutationObserver = new MutationObserver(updateScrollMasks);
    mutationObserver.observe(list, { childList: true, subtree: true });
    list.addEventListener('scroll', updateScrollMasks, { passive: true });

    return () =>
    {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      list.removeEventListener('scroll', updateScrollMasks);
    };
  }, [updateScrollMasks]);

  if (Sessions.length === 0)
  {
    return null;
  }

  return (
    <div
      ref={listRef}
      className={clsx(
        'cui-agent-thread-list',
        scrollMasks.top && 'cui-agent-thread-list--mask-top',
        scrollMasks.bottom && 'cui-agent-thread-list--mask-bottom',
        className
      )}
    >
      <div className="cui-agent-thread-list-content">
        <div className="cui-agent-thread-list-group">
          <span className="cui-agent-thread-list-group-label">Threads</span>
          <IconButton
            size="small"
            onClick={ClearAllSessions}
            title="Clear all threads"
            ariaLabel="Clear all threads"
            className="cui-agent-thread-list-clear"
          >
            <Trash2 size={13} strokeWidth={2} />
          </IconButton>
        </div>
        {Sessions.map((session) => (
          <SessionItem
            key={session.Id}
            session={session}
            isSelected={ActiveSession?.Id === session.Id}
            onSelect={SelectSession}
            onDelete={DeleteSession}
            onRename={RenameSession}
          />
        ))}
      </div>
    </div>
  );
};
