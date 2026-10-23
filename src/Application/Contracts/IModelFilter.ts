import { IModelDescriptor } from '../../Core/Domain/Entities/Definitions/IModelDescriptor';

export interface IModelFilter
{
  Apply(models: IModelDescriptor[]): IModelDescriptor[];
}
