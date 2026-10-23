import { IModelRepository } from '../../../Application/Contracts/IModelRepository';
import { IModelDescriptor } from '../../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { OpenCodeApiClient } from './OpenCodeApiClient';
import { OpenCodeModelMapper } from './OpenCodeModelMapper';

export class OpenCodeModelRepository implements IModelRepository
{
  private readonly _apiClient: OpenCodeApiClient;
  private readonly _modelMapper: OpenCodeModelMapper;

  public constructor(
    apiClient: OpenCodeApiClient = new OpenCodeApiClient(),
    modelMapper: OpenCodeModelMapper = new OpenCodeModelMapper()
  )
  {
    this._apiClient = apiClient;
    this._modelMapper = modelMapper;
  }

  public async GetModelsAsync(): Promise<IModelDescriptor[]>
  {
    const modelDtos = await this._apiClient.GetModelsAsync();

    return modelDtos.map((dto) => this._modelMapper.Map(dto));
  }
}
