import { useContext } from 'react';
import { ChatContext } from '../Contexts/ChatContext';
import { IChatContextValue } from '../Contracts/IChatContextValue';

export function UseChat(): IChatContextValue
{
  const context = useContext(ChatContext);
  if (!context)
  {
    throw new Error('UseChat must be used within a ChatProvider');
  }
  return context;
}
