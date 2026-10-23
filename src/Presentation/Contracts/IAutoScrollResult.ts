import { RefObject } from 'react';

export interface IAutoScrollResult
{
  ContainerRef: RefObject<HTMLDivElement>;
  IsAtBottom: boolean;
  ScrollToBottom(smooth?: boolean): void;
}
