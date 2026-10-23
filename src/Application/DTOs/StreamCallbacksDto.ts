import { IChatSearchState } from '../../Core/Domain/DTOs/IChatSearchState';

export class StreamCallbacksDto
{
  public readonly OnChunk: (chunk: string) => void;
  public readonly OnComplete: (fullText: string) => void;
  public readonly OnError: (error: Error) => void;
  public readonly OnReasoning?: (chunk: string) => void;
  public readonly OnSearch?: (search: IChatSearchState) => void;

  public constructor(
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: Error) => void,
    onReasoning?: (chunk: string) => void,
    onSearch?: (search: IChatSearchState) => void
  )
  {
    this.OnChunk = onChunk;
    this.OnComplete = onComplete;
    this.OnError = onError;
    this.OnReasoning = onReasoning;
    this.OnSearch = onSearch;
  }
}
