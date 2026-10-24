import { IChatCitation } from '../../../../Core/Domain/Entities/Definitions/IChatCitation';

export type OpenAIStreamEventType =
  | 'job'
  | 'status'
  | 'content'
  | 'reasoning'
  | 'search'
  | 'error'
  | 'done';

export type OpenAISearchPhase = 'searching' | 'completed' | 'failed';

/** One normalized server-sent event produced by the ChatUI OpenAI route. */
export interface IOpenAIStreamEventDto
{
  type: OpenAIStreamEventType;
  value?: string;
  message?: string;
  phase?: OpenAISearchPhase;
  engine?: string;
  citations?: IChatCitation[];
  jobId?: string;
  index?: number;
}
