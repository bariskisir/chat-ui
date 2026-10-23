import { IChatMessage } from '../../Core/Domain/Entities/Definitions/IChatMessage';
import { ModelIdentifier } from '../../Core/Domain/Enums/ModelIdentifier';

export interface IStoredSessionDto
{
  Id: string;
  Title: string;
  CreatedAt: number;
  UpdatedAt: number;
  Model: ModelIdentifier;
  Messages: IChatMessage[];
}
