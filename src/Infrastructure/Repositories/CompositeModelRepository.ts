import { IModelRepository } from '../../Application/Contracts/IModelRepository';
import { IModelDescriptor } from '../../Core/Domain/Entities/Definitions/IModelDescriptor';

export class CompositeModelRepository implements IModelRepository
{
  private readonly _repositories: IModelRepository[];

  public constructor(repositories: IModelRepository[])
  {
    this._repositories = [...repositories];
  }

  public async GetModelsAsync(): Promise<IModelDescriptor[]>
  {
    const results = await Promise.allSettled(
      this._repositories.map((repository) => repository.GetModelsAsync())
    );

    const modelsById = new Map<string, IModelDescriptor>();
    const errors: unknown[] = [];

    for (const result of results)
    {
      if (result.status === 'fulfilled')
      {
        for (const model of result.value)
        {
          if (!modelsById.has(model.Id))
          {
            modelsById.set(model.Id, model);
          }
        }
        continue;
      }

      errors.push(result.reason);
    }

    if (modelsById.size === 0 && errors.length > 0)
    {
      const firstError = errors[0];
      throw firstError instanceof Error ? firstError : new Error(String(firstError));
    }

    return [...modelsById.values()];
  }
}
