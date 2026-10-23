import { IChatSearchState } from '../../../Core/Domain/DTOs/IChatSearchState';
import { ChatSearchStatus } from '../../../Core/Domain/Enums/ChatSearchStatus';
import { WebSearchEngine } from '../../../Core/Domain/Enums/WebSearchMode';
import { IOpenCodeStreamEventDto } from './DTOs/IOpenCodeStreamEventDto';

export class OpenCodeStreamParser
{
  public async ParseAsync(
    stream: ReadableStream<Uint8Array>,
    onChunk: (chunk: string) => void,
    onReasoning?: (chunk: string) => void,
    onSearch?: (search: IChatSearchState) => void,
    signal?: AbortSignal
  ): Promise<string>
  {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let isCompleted = false;

    try
    {
      while (!isCompleted)
      {
        if (signal?.aborted)
        {
          break;
        }

        const { done, value } = await reader.read();
        if (done)
        {
          buffer += decoder.decode();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines)
        {
          const result = this.ParseLine(line);
          if (!result)
          {
            continue;
          }

          if (result.IsError)
          {
            throw new Error(result.ErrorMessage);
          }

          if (result.IsDone)
          {
            isCompleted = true;
            break;
          }

          if (result.Reasoning.length > 0)
          {
            onReasoning?.(result.Reasoning);
          }

          if (result.Search)
          {
            onSearch?.(result.Search);
          }

          if (result.Content.length > 0)
          {
            fullText += result.Content;
            onChunk(result.Content);
          }
        }
      }

      if (!isCompleted && buffer.trim().length > 0)
      {
        const result = this.ParseLine(buffer);
        if (result?.IsError)
        {
          throw new Error(result.ErrorMessage);
        }

        if (result && !result.IsDone)
        {
          if (result.Reasoning.length > 0)
          {
            onReasoning?.(result.Reasoning);
          }

          if (result.Search)
          {
            onSearch?.(result.Search);
          }

          if (result.Content.length > 0)
          {
            fullText += result.Content;
            onChunk(result.Content);
          }
        }
      }
    }
    finally
    {
      reader.releaseLock();
    }

    return fullText;
  }

  private ParseLine(line: string): IOpenCodeStreamEventResult | null
  {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:'))
    {
      return null;
    }

    const data = trimmed.substring(5).trim();
    if (!data)
    {
      return null;
    }

    let event: IOpenCodeStreamEventDto;
    try
    {
      event = JSON.parse(data) as IOpenCodeStreamEventDto;
    }
    catch
    {
      return null;
    }

    switch (event.type)
    {
      case 'content':
        return {
          IsDone: false,
          IsError: false,
          ErrorMessage: '',
          Content: typeof event.value === 'string' ? event.value : '',
          Reasoning: ''
        };
      case 'reasoning':
        return {
          IsDone: false,
          IsError: false,
          ErrorMessage: '',
          Content: '',
          Reasoning: typeof event.value === 'string' ? event.value : ''
        };
      case 'search':
        return {
          IsDone: false,
          IsError: false,
          ErrorMessage: '',
          Content: '',
          Reasoning: '',
          Search: this.MapSearchEvent(event)
        };
      case 'error':
        return {
          IsDone: false,
          IsError: true,
          ErrorMessage: typeof event.message === 'string' && event.message.trim()
            ? event.message
            : 'The response could not be completed. Please try again.',
          Content: '',
          Reasoning: ''
        };
      case 'done':
        return {
          IsDone: true,
          IsError: false,
          ErrorMessage: '',
          Content: '',
          Reasoning: ''
        };
      case 'status':
      default:
        return null;
    }
  }

  private MapSearchEvent(event: IOpenCodeStreamEventDto): IChatSearchState | undefined
  {
    if (!OpenCodeStreamParser.IsSearchEngine(event.engine) || !event.phase)
    {
      return undefined;
    }

    if (event.phase === 'searching')
    {
      return {
        Engine: event.engine,
        Status: ChatSearchStatus.Searching,
        Citations: []
      };
    }

    if (event.phase === 'failed')
    {
      return {
        Engine: event.engine,
        Status: ChatSearchStatus.Failed,
        Citations: []
      };
    }

    const citations = Array.isArray(event.citations)
      ? event.citations
        .filter((citation) =>
        {
          return Boolean(citation)
            && typeof citation.Index === 'number'
            && typeof citation.Title === 'string'
            && typeof citation.Url === 'string'
            && typeof citation.Snippet === 'string';
        })
        .map((citation) => ({ ...citation }))
      : [];

    return {
      Engine: event.engine,
      Status: ChatSearchStatus.Completed,
      Citations: citations
    };
  }

  private static IsSearchEngine(value: string | undefined): value is WebSearchEngine
  {
    return value === 'google' || value === 'bing' || value === 'duckduckgo';
  }
}

interface IOpenCodeStreamEventResult
{
  IsDone: boolean;
  IsError: boolean;
  ErrorMessage: string;
  Content: string;
  Reasoning: string;
  Search?: IChatSearchState;
}
