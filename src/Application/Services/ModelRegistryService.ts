import { IModelRepository } from '../Contracts/IModelRepository';
import { IModelDescriptor } from '../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelDescriptor } from '../../Core/Domain/Entities/Implementations/ModelDescriptor';
import { ModelIdentifier } from '../../Core/Domain/Enums/ModelIdentifier';

export class ModelRegistryService implements IModelRepository
{
  private readonly _models: IModelDescriptor[];

  public constructor()
  {
    this._models = [
      new ModelDescriptor(
        ModelIdentifier.Model1,
        'Model 1',
        'Optimized for ultra-fast, snappy reasoning',
        'Fast',
        4096
      ),
      new ModelDescriptor(
        ModelIdentifier.Model2,
        'Model 2',
        'Balanced intelligence with advanced contextual grasp',
        'Pro',
        8192
      ),
      new ModelDescriptor(
        ModelIdentifier.Model3,
        'Model 3',
        'Deep cognitive thinking for complex coding and tasks',
        'Max',
        16384
      )
    ];
  }

  public GetAllModels(): IModelDescriptor[]
  {
    return [...this._models];
  }

  public GetModelById(id: ModelIdentifier): IModelDescriptor | undefined
  {
    return this._models.find((m) => m.Id === id);
  }

  public GetDefaultModel(): IModelDescriptor
  {
    return this._models[0];
  }
}
