import { IModelDescriptor } from '../../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelDescriptor } from '../../../Core/Domain/Entities/Implementations/ModelDescriptor';
import { ReasoningEfforts } from '../../../Core/Domain/Enums/ReasoningEffort';
import { ServiceProviderType } from '../../../Core/Domain/Enums/ServiceProviderType';
import { IOpenAIModelDto } from './DTOs/IOpenAIModelDto';

export class OpenAIModelMapper
{
  public Map(dto: IOpenAIModelDto): IModelDescriptor
  {
    return new ModelDescriptor(
      `${dto.providerId}:${dto.id}`,
      dto.id,
      dto.name,
      0,
      ServiceProviderType.OpenAI,
      dto.providerId,
      dto.providerName,
      false,
      [...ReasoningEfforts]
    );
  }
}
