import { FC, ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface IComposerPopoverProps
{
  isOpen: boolean;
  anchorRef: RefObject<HTMLElement>;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

interface IPopoverPosition
{
  left: number;
  bottom: number;
  width: number;
  maxHeight: number;
}

export const ComposerPopover: FC<IComposerPopoverProps> =
({
  isOpen,
  anchorRef,
  onClose,
  className,
  children
}) =>
{
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<IPopoverPosition | null>(null);

  useLayoutEffect(() =>
  {
    if (!isOpen)
    {
      setPosition(null);
      return;
    }

    const updatePosition = () =>
    {
      const anchor = anchorRef.current;
      if (!anchor)
      {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const width = Math.min(300, window.innerWidth - 16);
      const left = Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - width - 8)
      );

      setPosition({
        left,
        bottom: Math.max(8, window.innerHeight - rect.top + 8),
        width,
        maxHeight: Math.max(160, rect.top - 16)
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () =>
    {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, anchorRef]);

  useEffect(() =>
  {
    if (!isOpen)
    {
      return;
    }

    const handlePointerDown = (event: MouseEvent) =>
    {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target))
      {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) =>
    {
      if (event.key === 'Escape')
      {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () =>
    {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, anchorRef, onClose]);

  if (!isOpen || !position || typeof document === 'undefined')
  {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      className={clsx('cui-composer-popover', className)}
      style={{
        left: position.left,
        bottom: position.bottom,
        width: position.width,
        maxHeight: position.maxHeight
      }}
      role="dialog"
    >
      {children}
    </div>,
    document.body
  );
};
