import { FC } from 'react';
import clsx from 'clsx';
import { ITypingIndicatorProps } from '../Definitions/ITypingIndicatorProps';

export const TypingIndicator: FC<ITypingIndicatorProps> = ({ className }) =>
{
  return (
    <div className={clsx('cui-typing-indicator', className)} aria-label="Thinking">
      <div className="cui-typing-indicator__dot" />
      <div className="cui-typing-indicator__dot" />
      <div className="cui-typing-indicator__dot" />
    </div>
  );
};
