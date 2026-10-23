import { createContext } from 'react';
import { IChatContextValue } from '../Contracts/IChatContextValue';

export const ChatContext = createContext<IChatContextValue | null>(null);
