export class TextChunkStreamer
{
  private static readonly WordsPerChunk = 4;
  private static readonly DefaultDelayMs = 18;

  public async StreamAsync(
    text: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
    delayMs: number = TextChunkStreamer.DefaultDelayMs
  ): Promise<string>
  {
    const normalizedText = text.trim();
    if (normalizedText.length === 0)
    {
      return '';
    }

    const words = normalizedText.split(' ');
    let streamedText = '';

    for (let index = 0; index < words.length; index += TextChunkStreamer.WordsPerChunk)
    {
      if (signal?.aborted)
      {
        break;
      }

      await this.DelayAsync(delayMs);

      if (signal?.aborted)
      {
        break;
      }

      const chunk = (index === 0 ? '' : ' ')
        + words.slice(index, index + TextChunkStreamer.WordsPerChunk).join(' ');

      streamedText += chunk;
      onChunk(chunk);
    }

    return streamedText;
  }

  private DelayAsync(ms: number): Promise<void>
  {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
