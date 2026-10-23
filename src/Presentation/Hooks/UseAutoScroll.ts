import { useRef, useState, useEffect, useCallback } from 'react';
import { IAutoScrollResult } from '../Contracts/IAutoScrollResult';

export function UseAutoScroll<T>(
  triggerDependency: T,
  isRunning = false
): IAutoScrollResult
{
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const hasUserScrolledWhenRunning = useRef<boolean>(false);

  const scrollToBottom = useCallback((smooth = true) =>
  {
    const el = containerRef.current;
    if (!el)
    {
      return;
    }

    const scrollDiff = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (smooth && scrollDiff > 90)
    {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      });
    }
    else
    {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() =>
  {
    const el = containerRef.current;
    if (!el)
    {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    const atBottom = distanceToBottom <= 40;
    setIsAtBottom(atBottom);

    if (atBottom)
    {
      hasUserScrolledWhenRunning.current = false;
    }
  }, []);

  useEffect(() =>
  {
    if (isRunning)
    {
      hasUserScrolledWhenRunning.current = false;
      scrollToBottom(false);
    }
  }, [isRunning, scrollToBottom]);

  useEffect(() =>
  {
    const el = containerRef.current;
    if (!el)
    {
      return;
    }

    const handleUserScrollIntent = () =>
    {
      if (isRunning)
      {
        const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
        if (distanceToBottom > 40)
        {
          hasUserScrolledWhenRunning.current = true;
        }
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    el.addEventListener('wheel', handleUserScrollIntent, { passive: true });
    el.addEventListener('touchmove', handleUserScrollIntent, { passive: true });

    return () =>
    {
      el.removeEventListener('scroll', handleScroll);
      el.removeEventListener('wheel', handleUserScrollIntent);
      el.removeEventListener('touchmove', handleUserScrollIntent);
    };
  }, [handleScroll, isRunning]);

  useEffect(() =>
  {
    const el = containerRef.current;
    if (!el)
    {
      return;
    }

    const handleContentChange = () =>
    {
      if (isRunning && !hasUserScrolledWhenRunning.current)
      {
        scrollToBottom(false);
      }
    };

    const mutationObserver = new MutationObserver(handleContentChange);
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true
    });

    const resizeObserver = new ResizeObserver(handleContentChange);
    resizeObserver.observe(el);

    return () =>
    {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [isRunning, scrollToBottom]);

  useEffect(() =>
  {
    if (isAtBottom && !hasUserScrolledWhenRunning.current)
    {
      scrollToBottom(false);
    }
  }, [triggerDependency, isAtBottom, scrollToBottom]);

  return {
    ContainerRef: containerRef,
    IsAtBottom: isAtBottom,
    ScrollToBottom: scrollToBottom
  };
}
