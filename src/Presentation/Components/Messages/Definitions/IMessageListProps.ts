import { IChatMessage } from '../../../../Core/Domain/Entities/Definitions/IChatMessage';

export interface IMessageListProps
{
  messages: IChatMessage[];
  isGenerating?: boolean;
}
