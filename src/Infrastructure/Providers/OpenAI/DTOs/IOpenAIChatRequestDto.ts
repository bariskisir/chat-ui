import { ReasoningEffort } from '../../../../Core/Domain/Enums/ReasoningEffort';
import { WebSearchMode } from '../../../../Core/Domain/Enums/WebSearchMode';
import { IOpenAIChatMessageDto } from './IOpenAIChatMessageDto';

export interface IOpenAIChatRequestDto
{
  prompt: string;
  history: IOpenAIChatMessageDto[];
  model: string;
  providerId: string;
  conversationId: string;
  reasoningEffort: ReasoningEffort;
  webSearchMode: WebSearchMode;
}
