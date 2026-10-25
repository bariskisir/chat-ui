import { RefObject } from 'react';

export interface IAutoScrollResult
{
  ContainerRef: RefObject<HTMLDivElement | null>;
  IsAtBottom: boolean;
  ScrollToBottom(smooth?: boolean): void;
}
