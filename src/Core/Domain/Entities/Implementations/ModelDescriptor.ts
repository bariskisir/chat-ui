import { IModelDescriptor } from '../Definitions/IModelDescriptor';
import { ModelIdentifier } from '../../Enums/ModelIdentifier';
import { ReasoningEffort } from '../../Enums/ReasoningEffort';
import { ServiceProviderType } from '../../Enums/ServiceProviderType';

export class ModelDescriptor implements IModelDescriptor
{
  public readonly Id: ModelIdentifier;
  public readonly ApiId: ModelIdentifier;
  public readonly Name: string;
  public readonly MaxTokens: number;
  public readonly Provider: ServiceProviderType;
  public readonly ProviderId: string;
  public readonly ProviderName: string;
  public readonly IsFree: boolean;
  public readonly ReasoningEfforts: ReasoningEffort[];

  public constructor(
    id: ModelIdentifier,
    apiId: ModelIdentifier,
    name: string,
    maxTokens: number,
    provider: ServiceProviderType,
    providerId: string,
    providerName: string,
    isFree = false,
    reasoningEfforts: ReasoningEffort[] = []
  )
  {
    this.Id = id;
    this.ApiId = apiId;
    this.Name = name;
    this.MaxTokens = maxTokens;
    this.Provider = provider;
    this.ProviderId = providerId;
    this.ProviderName = providerName;
    this.IsFree = isFree;
    this.ReasoningEfforts = [...reasoningEfforts];
  }
}
