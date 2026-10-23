import { createContext } from 'react';
import { IModelContextValue } from '../Contracts/IModelContextValue';

export const ModelContext = createContext<IModelContextValue | null>(null);
