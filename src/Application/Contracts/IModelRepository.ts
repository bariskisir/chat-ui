import { IModelDescriptor } from '../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelIdentifier } from '../../Core/Domain/Enums/ModelIdentifier';

export interface IModelRepository
{
  GetAllModels(): IModelDescriptor[];
  GetModelById(id: ModelIdentifier): IModelDescriptor | undefined;
  GetDefaultModel(): IModelDescriptor;
}
