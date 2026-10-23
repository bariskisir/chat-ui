import { IChatMessage } from '../../Core/Domain/Entities/Definitions/IChatMessage';
import { ModelIdentifier } from '../../Core/Domain/Enums/ModelIdentifier';
import { ReasoningEffort } from '../../Core/Domain/Enums/ReasoningEffort';
import { ServiceProviderType } from '../../Core/Domain/Enums/ServiceProviderType';
import { WebSearchMode } from '../../Core/Domain/Enums/WebSearchMode';

export class ChatRequestDto
{
  public readonly Prompt: string;
  public readonly History: IChatMessage[];
  public readonly Model: ModelIdentifier;
  public readonly Provider: ServiceProviderType;
  public readonly ConversationId: string;
  public readonly AbortSignal?: AbortSignal;
  public readonly ReasoningEffort: ReasoningEffort;
  public readonly WebSearchMode: WebSearchMode;

  public constructor(
    prompt: string,
    history: IChatMessage[],
    model: ModelIdentifier,
    provider: ServiceProviderType,
    conversationId: string,
    abortSignal?: AbortSignal,
    reasoningEffort: ReasoningEffort = 'default',
    webSearchMode: WebSearchMode = 'off'
  )
  {
    this.Prompt = prompt;
    this.History = history;
    this.Model = model;
    this.Provider = provider;
    this.ConversationId = conversationId;
    this.AbortSignal = abortSignal;
    this.ReasoningEffort = reasoningEffort;
    this.WebSearchMode = webSearchMode;
  }
}
