import { IModelRepository } from '../../../Application/Contracts/IModelRepository';
import { IModelDescriptor } from '../../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelDescriptor } from '../../../Core/Domain/Entities/Implementations/ModelDescriptor';
import { ServiceProviderType } from '../../../Core/Domain/Enums/ServiceProviderType';

export class MockModelRepository implements IModelRepository
{
  public async GetModelsAsync(): Promise<IModelDescriptor[]>
  {
    return [
      new ModelDescriptor(
        'mock',
        'Mock',
        'Local',
        4096,
        ServiceProviderType.Mock,
        true
      )
    ];
  }
}
