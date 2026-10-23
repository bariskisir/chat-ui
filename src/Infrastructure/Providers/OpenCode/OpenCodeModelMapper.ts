import { IModelDescriptor } from '../../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelDescriptor } from '../../../Core/Domain/Entities/Implementations/ModelDescriptor';
import { ReasoningEfforts } from '../../../Core/Domain/Enums/ReasoningEffort';
import { ServiceProviderType } from '../../../Core/Domain/Enums/ServiceProviderType';
import { IOpenCodeModelDto } from './DTOs/IOpenCodeModelDto';

export class OpenCodeModelMapper
{
  public Map(dto: IOpenCodeModelDto): IModelDescriptor
  {
    return new ModelDescriptor(
      dto.id,
      dto.name,
      dto.badge,
      0,
      ServiceProviderType.OpenCode,
      true,
      [...ReasoningEfforts]
    );
  }
}
