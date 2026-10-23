import { IModelFilter } from '../../Contracts/IModelFilter';
import { IModelDescriptor } from '../../../Core/Domain/Entities/Definitions/IModelDescriptor';

export class FreeModelFilter implements IModelFilter
{
  public Apply(models: IModelDescriptor[]): IModelDescriptor[]
  {
    return models.filter((model) => model.IsFree);
  }
}
