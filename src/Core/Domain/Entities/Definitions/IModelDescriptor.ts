import { ModelIdentifier } from '../../Enums/ModelIdentifier';
import { ReasoningEffort } from '../../Enums/ReasoningEffort';
import { ServiceProviderType } from '../../Enums/ServiceProviderType';

export interface IModelDescriptor
{
  Id: ModelIdentifier;
  ApiId: ModelIdentifier;
  Name: string;
  MaxTokens: number;
  Provider: ServiceProviderType;
  ProviderId: string;
  ProviderName: string;
  IsFree: boolean;
  ReasoningEfforts: ReasoningEffort[];
}
