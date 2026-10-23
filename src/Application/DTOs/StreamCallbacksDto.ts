export class StreamCallbacksDto
{
  public readonly OnChunk: (chunk: string) => void;
  public readonly OnComplete: (fullText: string) => void;
  public readonly OnError: (error: Error) => void;

  public constructor(
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: Error) => void
  )
  {
    this.OnChunk = onChunk;
    this.OnComplete = onComplete;
    this.OnError = onError;
  }
}
