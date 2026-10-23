import { FC, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronRight, Copy, Lightbulb } from 'lucide-react';
import { IThinkingBlockProps } from '../Definitions/IThinkingBlockProps';
import { MarkdownContent } from '../../Common/Implementations/MarkdownContent';

const PreviewLength = 160;

export const ThinkingBlock: FC<IThinkingBlockProps> = ({ content, streaming }) =>
{
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const preview = useMemo(() =>
  {
    const lastLine = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .pop() ?? '';

    return lastLine.length > PreviewLength
      ? lastLine.substring(0, PreviewLength) + '...'
      : lastLine;
  }, [content]);

  const handleCopy = async () =>
  {
    try
    {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
    catch
    {
      // Clipboard access can be unavailable in restricted browser contexts.
    }
  };

  return (
    <section
      className={clsx(
        'cui-thinking-block',
        isExpanded && 'cui-thinking-block--expanded'
      )}
    >
      <button
        type="button"
        className="cui-thinking-block__header"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span
          className={clsx(
            'cui-thinking-block__icon',
            streaming && 'cui-thinking-block__icon--active'
          )}
        >
          <Lightbulb size={15} strokeWidth={2} />
        </span>
        <span className="cui-thinking-block__heading">
          <strong>{streaming ? 'Thinking...' : 'Reasoning'}</strong>
          {!isExpanded && preview && <small>{preview}</small>}
        </span>
        <ChevronRight className="cui-thinking-block__chevron" size={18} />
      </button>

      {isExpanded && (
        <div className="cui-thinking-block__content">
          <button
            type="button"
            className="cui-thinking-block__copy"
            onClick={() => void handleCopy()}
            title={isCopied ? 'Copied to clipboard' : 'Copy reasoning'}
            aria-label={isCopied ? 'Copied to clipboard' : 'Copy reasoning'}
          >
            {isCopied
              ? <Check size={13} strokeWidth={2.5} />
              : <Copy size={13} strokeWidth={2} />}
          </button>
          <div className="cui-thinking-block__text">
            <MarkdownContent content={content} />
          </div>
        </div>
      )}
    </section>
  );
};
