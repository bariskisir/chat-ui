import { ReactNode } from 'react';
import { IModelRepository } from '../../../Application/Contracts/IModelRepository';

export interface IModelProviderProps
{
  children: ReactNode;
  repository: IModelRepository;
}
