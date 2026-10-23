import { FC, useMemo } from 'react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IChatCitation } from '../../../../Core/Domain/Entities/Definitions/IChatCitation';
import {
  ReadLinkText,
  ResolveCitation,
  WithCitationLinks
} from '../../../Utils/MarkdownCitations';

interface IMarkdownContentProps
{
  content: string;
  citations?: IChatCitation[];
  className?: string;
}

/** Renders assistant output with GitHub-flavored Markdown and clickable citations. */
export const MarkdownContent: FC<IMarkdownContentProps> = ({
  content,
  citations = [],
  className
}) =>
{
  const renderedContent = useMemo(
    () => WithCitationLinks(content, citations),
    [content, citations]
  );

  return (
    <div className={clsx('cui-markdown', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, children, href, ...props }) =>
          {
            void node;
            const citation = ResolveCitation(href, ReadLinkText(children), citations);

            if (citation)
            {
              return (
                <sup className="cui-citation">
                  <a
                    {...props}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${citation.Title}\n${citation.Snippet}`}
                    aria-label={`Source ${citation.Index}: ${citation.Title}`}
                  >
                    {citation.Index}
                  </a>
                </sup>
              );
            }

            return (
              <a {...props} href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          }
        }}
      >
        {renderedContent}
      </ReactMarkdown>
    </div>
  );
};
