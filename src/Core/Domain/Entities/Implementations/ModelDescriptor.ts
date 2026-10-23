import { IModelDescriptor } from '../Definitions/IModelDescriptor';
import { ModelIdentifier } from '../../Enums/ModelIdentifier';

export class ModelDescriptor implements IModelDescriptor
{
  public readonly Id: ModelIdentifier;
  public readonly Name: string;
  public readonly Tagline: string;
  public readonly Badge: string;
  public readonly MaxTokens: number;

  public constructor(
    id: ModelIdentifier,
    name: string,
    tagline: string,
    badge: string,
    maxTokens: number
  )
  {
    this.Id = id;
    this.Name = name;
    this.Tagline = tagline;
    this.Badge = badge;
    this.MaxTokens = maxTokens;
  }
}
