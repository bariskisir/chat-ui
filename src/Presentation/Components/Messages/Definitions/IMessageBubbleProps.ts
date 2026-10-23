import { IChatMessage } from '../../../../Core/Domain/Entities/Definitions/IChatMessage';

export interface IMessageBubbleProps
{
  message: IChatMessage;
  isLatestAssistant?: boolean;
  isStreaming?: boolean;
}
