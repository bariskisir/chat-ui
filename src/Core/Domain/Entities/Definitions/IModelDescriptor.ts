import { ModelIdentifier } from '../../Enums/ModelIdentifier';

export interface IModelDescriptor
{
  Id: ModelIdentifier;
  Name: string;
  Tagline: string;
  Badge: string;
  MaxTokens: number;
}
