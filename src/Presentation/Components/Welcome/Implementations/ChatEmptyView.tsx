import { FC } from 'react';
import clsx from 'clsx';
import { IChatEmptyViewProps } from '../Definitions/IChatEmptyViewProps';
import { ChatBrandIcon } from '../../Common/Implementations/ChatBrandIcon';
import { PromptComposer } from '../../Composer/Implementations/PromptComposer';

export const ChatEmptyView: FC<IChatEmptyViewProps> = ({ className, isMobile = false }) =>
{
  return (
    <div className={clsx('cui-agent-welcome-screen', className)}>
      <div className="cui-agent-welcome-screen__header">
        <div className="cui-agent-welcome-screen__icon-container">
          <ChatBrandIcon size={38} />
        </div>
        <div className="cui-agent-welcome-screen__content">
          <h2 className="cui-agent-welcome-screen__title">What can I help with?</h2>
        </div>
      </div>

      {!isMobile && (
        <div className="cui-agent-welcome-screen__composer-container">
          <PromptComposer isCentered />
        </div>
      )}
    </div>
  );
};
