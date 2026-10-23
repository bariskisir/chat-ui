import { IModelRepository } from '../../Application/Contracts/IModelRepository';
import { IStorageService } from '../../Application/Contracts/IStorageService';
import { IModelDescriptor } from '../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelDescriptor } from '../../Core/Domain/Entities/Implementations/ModelDescriptor';
import { ReasoningEfforts } from '../../Core/Domain/Enums/ReasoningEffort';
import { ServiceProviderType } from '../../Core/Domain/Enums/ServiceProviderType';

const CacheKey = 'cui_model_catalog_v1';
const KnownProviders = new Set<string>(Object.values(ServiceProviderType));
const KnownEfforts = new Set<string>(ReasoningEfforts);

/** Keeps the model catalog for the lifetime of the browser tab. */
export class SessionCachedModelRepository implements IModelRepository
{
  private readonly _repository: IModelRepository;
  private readonly _storageService: IStorageService;
  private _pendingModels: Promise<IModelDescriptor[]> | null = null;

  public constructor(repository: IModelRepository, storageService: IStorageService)
  {
    this._repository = repository;
    this._storageService = storageService;
  }

  public GetModelsAsync(): Promise<IModelDescriptor[]>
  {
    const cachedModels = this.ReadCachedModels();
    if (cachedModels)
    {
      return Promise.resolve(cachedModels);
    }

    if (!this._pendingModels)
    {
      this._pendingModels = this.LoadModelsAsync()
        .finally(() =>
        {
          this._pendingModels = null;
        });
    }

    return this._pendingModels;
  }

  private async LoadModelsAsync(): Promise<IModelDescriptor[]>
  {
    const models = await this._repository.GetModelsAsync();

    if (models.length > 0)
    {
      this._storageService.SetItem(CacheKey, models);
    }

    return models;
  }

  private ReadCachedModels(): IModelDescriptor[] | null
  {
    const rawModels = this._storageService.GetItem<unknown>(CacheKey);
    if (rawModels === null)
    {
      return null;
    }

    const models = this.ParseModels(rawModels);
    if (models)
    {
      return models;
    }

    this._storageService.RemoveItem(CacheKey);
    return null;
  }

  private ParseModels(value: unknown): IModelDescriptor[] | null
  {
    if (!Array.isArray(value) || value.length === 0)
    {
      return null;
    }

    const models: IModelDescriptor[] = [];

    for (const entry of value)
    {
      if (!entry || typeof entry !== 'object')
      {
        return null;
      }

      const model = entry as Partial<IModelDescriptor>;

      if (typeof model.Id !== 'string' || model.Id.length === 0
        || typeof model.Name !== 'string'
        || typeof model.Badge !== 'string'
        || typeof model.MaxTokens !== 'number'
        || typeof model.Provider !== 'string'
        || !KnownProviders.has(model.Provider)
        || typeof model.IsFree !== 'boolean'
        || !Array.isArray(model.ReasoningEfforts)
        || !model.ReasoningEfforts.every((effort) => typeof effort === 'string' && KnownEfforts.has(effort)))
      {
        return null;
      }

      models.push(new ModelDescriptor(
        model.Id,
        model.Name,
        model.Badge,
        model.MaxTokens,
        model.Provider as ServiceProviderType,
        model.IsFree,
        [...model.ReasoningEfforts]
      ));
    }

    return models;
  }
}
