import { useContext } from 'react';
import { ModelContext } from '../Contexts/ModelContext';
import { IModelContextValue } from '../Contracts/IModelContextValue';

export function UseModel(): IModelContextValue
{
  const context = useContext(ModelContext);
  if (!context)
  {
    throw new Error('UseModel must be used within a ModelProvider');
  }
  return context;
}
