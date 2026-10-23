import { FC, useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { ISessionListProps } from '../Definitions/ISessionListProps';
import { UseChat } from '../../../Hooks/UseChat';
import { SessionItem } from './SessionItem';

export const SessionList: FC<ISessionListProps> = ({ className }) =>
{
  const {
    Sessions,
    ActiveSession,
    SelectSession,
    DeleteSession,
    RenameSession
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
        <div className="cui-agent-thread-list-group">Threads</div>
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
