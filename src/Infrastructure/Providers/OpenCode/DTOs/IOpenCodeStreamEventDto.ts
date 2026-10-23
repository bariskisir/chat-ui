import { IChatCitation } from '../../../../Core/Domain/Entities/Definitions/IChatCitation';

export type OpenCodeStreamEventType = 'status' | 'content' | 'reasoning' | 'search' | 'error' | 'done';

export type OpenCodeSearchPhase = 'searching' | 'completed' | 'failed';

/** One normalized server-sent event produced by the ChatUI OpenCode route. */
export interface IOpenCodeStreamEventDto
{
  type: OpenCodeStreamEventType;
  value?: string;
  message?: string;
  phase?: OpenCodeSearchPhase;
  engine?: string;
  citations?: IChatCitation[];
}
