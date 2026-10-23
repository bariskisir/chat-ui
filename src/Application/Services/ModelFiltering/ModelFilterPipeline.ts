import { IModelFilter } from '../../Contracts/IModelFilter';
import { IModelDescriptor } from '../../../Core/Domain/Entities/Definitions/IModelDescriptor';

export class ModelFilterPipeline
{
  private readonly _filters: IModelFilter[];

  public constructor(filters: IModelFilter[])
  {
    this._filters = [...filters];
  }

  public Apply(models: IModelDescriptor[]): IModelDescriptor[]
  {
    return this._filters.reduce(
      (currentModels, filter) => filter.Apply(currentModels),
      models
    );
  }
}
