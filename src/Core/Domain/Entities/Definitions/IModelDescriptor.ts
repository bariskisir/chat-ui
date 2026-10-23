import { ModelIdentifier } from '../../Enums/ModelIdentifier';
import { ReasoningEffort } from '../../Enums/ReasoningEffort';
import { ServiceProviderType } from '../../Enums/ServiceProviderType';

export interface IModelDescriptor
{
  Id: ModelIdentifier;
  Name: string;
  Badge: string;
  MaxTokens: number;
  Provider: ServiceProviderType;
  IsFree: boolean;
  ReasoningEfforts: ReasoningEffort[];
}
