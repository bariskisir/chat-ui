import { FC } from 'react';
import clsx from 'clsx';
import { IIconButtonProps } from '../Definitions/IIconButtonProps';

export const IconButton: FC<IIconButtonProps> = ({
  children,
  onClick,
  title,
  ariaLabel,
  className,
  size = 'default',
  disabled = false
}) =>
{
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      disabled={disabled}
      className={clsx(
        'cui-icon-button',
        size === 'small' && 'cui-icon-button--small',
        className
      )}
    >
      {children}
    </button>
  );
};
