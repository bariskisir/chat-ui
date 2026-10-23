import { FC } from 'react';
import clsx from 'clsx';
import { FileText, X } from 'lucide-react';
import { IAttachmentChipProps } from '../Definitions/IAttachmentChipProps';

const FormatSize = (size: number): string =>
{
  if (size < 1024)
  {
    return `${size} B`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

export const AttachmentChip: FC<IAttachmentChipProps> = ({
  attachment,
  className,
  tone = 'default',
  onRemove
}) =>
{
  const formattedSize = FormatSize(attachment.Size);

  return (
    <div
      className={clsx(
        'cui-attachment-chip',
        tone === 'inverted' && 'cui-attachment-chip--inverted',
        className
      )}
      title={attachment.Name}
    >
      <FileText className="cui-attachment-chip__icon" size={13} strokeWidth={2} />
      <span className="cui-attachment-chip__name">{attachment.Name}</span>
      <span className="cui-attachment-chip__size">{formattedSize}</span>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="cui-attachment-chip__remove"
          title={`Remove ${attachment.Name}`}
          aria-label={`Remove ${attachment.Name}`}
        >
          <X size={12} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};
