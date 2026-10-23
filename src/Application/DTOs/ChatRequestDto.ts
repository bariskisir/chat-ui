import { IChatMessage } from '../../Core/Domain/Entities/Definitions/IChatMessage';
import { ModelIdentifier } from '../../Core/Domain/Enums/ModelIdentifier';

export class ChatRequestDto
{
  public readonly Prompt: string;
  public readonly History: IChatMessage[];
  public readonly Model: ModelIdentifier;
  public readonly AbortSignal?: AbortSignal;

  public constructor(
    prompt: string,
    history: IChatMessage[],
    model: ModelIdentifier,
    abortSignal?: AbortSignal
  )
  {
    this.Prompt = prompt;
    this.History = history;
    this.Model = model;
    this.AbortSignal = abortSignal;
  }
}
