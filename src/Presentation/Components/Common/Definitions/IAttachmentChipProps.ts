import { IChatAttachment } from '../../../../Core/Domain/Entities/Definitions/IChatAttachment';

export interface IAttachmentChipProps
{
  attachment: IChatAttachment;
  className?: string;
  tone?: 'default' | 'inverted';
  onRemove?: () => void;
}
