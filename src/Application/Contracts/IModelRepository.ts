import { IModelDescriptor } from '../../Core/Domain/Entities/Definitions/IModelDescriptor';

export interface IModelRepository
{
  GetModelsAsync(): Promise<IModelDescriptor[]>;
}
