import { IModelRepository } from '../../../Application/Contracts/IModelRepository';
import { IModelDescriptor } from '../../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { OpenAIApiClient } from './OpenAIApiClient';
import { OpenAIModelMapper } from './OpenAIModelMapper';

export class OpenAIModelRepository implements IModelRepository
{
  private readonly _apiClient: OpenAIApiClient;
  private readonly _modelMapper: OpenAIModelMapper;

  public constructor(
    apiClient: OpenAIApiClient = new OpenAIApiClient(),
    modelMapper: OpenAIModelMapper = new OpenAIModelMapper()
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
