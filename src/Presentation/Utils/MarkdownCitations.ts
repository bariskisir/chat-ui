import { IChatCitation } from '../../Core/Domain/Entities/Definitions/IChatCitation';

const ProtectedCodePattern = /(```[\s\S]*?```|`[^`\n]*`)/g;

/** Returns a Markdown-safe absolute URL or null for unsupported schemes. */
export function ReadSafeCitationUrl(url: string): string | null
{
  try
  {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    {
      return null;
    }

    return encodeURI(parsed.href)
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');
  }
  catch
  {
    return null;
  }
}

/** Converts known [N] markers into Markdown links without touching code spans. */
export function WithCitationLinks(content: string, citations: IChatCitation[]): string
{
  if (!content || citations.length === 0)
  {
    return content;
  }

  const citationMap = new Map(citations.map((citation) => [citation.Index, citation]));
  const segments = content.split(ProtectedCodePattern);

  return segments
    .map((segment, index) =>
    {
      if (index % 2 === 1)
      {
        return segment;
      }

      return segment.replace(/\[(\d+)\]/g, (match, rawIndex: string) =>
      {
        const citation = citationMap.get(Number(rawIndex));
        const url = citation ? ReadSafeCitationUrl(citation.Url) : null;

        return citation && url ? `[${citation.Index}](<${url}>)` : match;
      });
    })
    .join('');
}

/** Reads the visible text of citation link children. */
export function ReadLinkText(children: unknown): string
{
  if (typeof children === 'string' || typeof children === 'number')
  {
    return String(children);
  }

  if (Array.isArray(children))
  {
    return children.map(ReadLinkText).join('');
  }

  return '';
}

/** Resolves a rendered numeric Markdown link back to its search citation. */
export function ResolveCitation(
  href: string | undefined,
  linkText: string,
  citations: IChatCitation[]
): IChatCitation | undefined
{
  if (!href || !/^\d+$/.test(linkText))
  {
    return undefined;
  }

  const index = Number(linkText);
  return citations.find((citation) =>
  {
    const safeUrl = ReadSafeCitationUrl(citation.Url);
    return citation.Index === index
      && safeUrl !== null
      && (href === safeUrl || href === citation.Url);
  });
}
