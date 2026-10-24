import { IChatCitation } from '../Entities/Definitions/IChatCitation';
import { WebSearchEngine } from '../Enums/WebSearchMode';
import { ChatSearchStatus } from '../Enums/ChatSearchStatus';

/** Captures the visible state of the web search that grounded one answer. */
export interface IChatSearchState
{
  Engine: WebSearchEngine;
  Status: ChatSearchStatus;
  Citations: IChatCitation[];
}
