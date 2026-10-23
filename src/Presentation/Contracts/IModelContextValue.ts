import { IModelDescriptor } from '../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelIdentifier } from '../../Core/Domain/Enums/ModelIdentifier';

export interface IModelContextValue
{
  SelectedModel: ModelIdentifier;
  Models: IModelDescriptor[];
  CurrentDescriptor: IModelDescriptor;
  SelectModel(id: ModelIdentifier): void;
}
