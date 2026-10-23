import { ReasoningEffort } from '../../../../Core/Domain/Enums/ReasoningEffort';
import { WebSearchMode } from '../../../../Core/Domain/Enums/WebSearchMode';
import { IOpenCodeChatMessageDto } from './IOpenCodeChatMessageDto';

export interface IOpenCodeChatRequestDto
{
  prompt: string;
  history: IOpenCodeChatMessageDto[];
  model: string;
  conversationId: string;
  reasoningEffort: ReasoningEffort;
  webSearchMode: WebSearchMode;
}
