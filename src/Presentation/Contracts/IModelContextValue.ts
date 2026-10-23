import { IModelDescriptor } from '../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelIdentifier } from '../../Core/Domain/Enums/ModelIdentifier';

export interface IModelContextValue
{
  SelectedModel: ModelIdentifier | null;
  Models: IModelDescriptor[];
  CurrentDescriptor: IModelDescriptor | null;
  IsLoading: boolean;
  ErrorMessage: string | null;
  SelectModel(id: ModelIdentifier): void;
}
