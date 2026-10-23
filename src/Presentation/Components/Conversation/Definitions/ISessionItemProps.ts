import { IConversationSession } from '../../../../Core/Domain/Entities/Definitions/IConversationSession';

export interface ISessionItemProps
{
  session: IConversationSession;
  isSelected: boolean;
  onSelect(id: string): void;
  onDelete(id: string): void;
  onRename(id: string, newTitle: string): void;
}
