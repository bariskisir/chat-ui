import { FC, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { ChatSearchStatus } from '../../../../Core/Domain/Enums/ChatSearchStatus';
import { IChatCitation } from '../../../../Core/Domain/Entities/Definitions/IChatCitation';
import { ISearchBlockProps } from '../Definitions/ISearchBlockProps';
import { SearchEngineIcon } from '../../Common/Implementations/SearchEngineIcon';

/** Returns a host label and a safe href for one search reference. */
function ReadReference(citation: IChatCitation): { label: string; href: string | null }
{
  try
  {
    const url = new URL(citation.Url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
    {
      return { label: citation.Url, href: null };
    }

    return { label: url.hostname.replace(/^www\./, ''), href: url.href };
  }
  catch
  {
    return { label: citation.Url, href: null };
  }
}

/** Builds the compact status line shown in the search header. */
function DescribeSearch(search: ISearchBlockProps['search']): string
{
  if (search.Status === ChatSearchStatus.Searching)
  {
    return 'Searching...';
  }

  if (search.Status === ChatSearchStatus.Failed)
  {
    return 'Search unsuccessful';
  }

  const count = search.Citations.length;
  if (count === 0)
  {
    return 'No sources found';
  }

  return count === 1 ? '1 source found' : `${count} sources found`;
}

export const SearchBlock: FC<ISearchBlockProps> = ({ search }) =>
{
  const [isExpanded, setIsExpanded] = useState(false);
  const status = DescribeSearch(search);
  const isSearching = search.Status === ChatSearchStatus.Searching;
  const references = useMemo(
    () => search.Citations.map((citation) => ({ citation, ...ReadReference(citation) })),
    [search.Citations]
  );

  return (
    <section
      className={clsx(
        'cui-search-block',
        isExpanded && 'cui-search-block--expanded'
      )}
    >
      <button
        type="button"
        className="cui-search-block__header"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
        disabled={references.length === 0}
      >
        <span
          className={clsx(
            'cui-search-block__icon',
            isSearching && 'cui-search-block__icon--active'
          )}
        >
          <SearchEngineIcon mode={search.Engine} size={15} />
        </span>
        <span className="cui-search-block__heading">
          <strong>{status}</strong>
        </span>
        {references.length > 0 && (
          <ChevronRight className="cui-search-block__chevron" size={18} />
        )}
      </button>

      {isExpanded && references.length > 0 && (
        <div className="cui-search-block__content">
          {references.map((reference) => (
            <div key={`${reference.citation.Index}-${reference.citation.Url}`}>
              {reference.href ? (
                <a
                  className="cui-search-block__reference"
                  href={reference.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="cui-search-block__reference-index">
                    {reference.citation.Index}
                  </span>
                  <span className="cui-search-block__reference-text">
                    {reference.label}
                    {reference.citation.Title && (
                      <span className="cui-search-block__reference-title">
                        {reference.citation.Title}
                      </span>
                    )}
                  </span>
                </a>
              ) : (
                <span className="cui-search-block__reference">
                  <span className="cui-search-block__reference-index">
                    {reference.citation.Index}
                  </span>
                  <span className="cui-search-block__reference-text">
                    {reference.label}
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
