import { ReactNode, MouseEventHandler } from 'react';

export interface IIconButtonProps
{
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  ariaLabel?: string;
  className?: string;
  size?: 'small' | 'default';
  disabled?: boolean;
}
