/**
 * Server-side web search pipeline modeled after AIChat: direct engine requests,
 * engine-specific result selectors, Readability extraction, and a hidden
 * DuckDuckGo fallback. Search internals never reach the browser.
 */

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { WebSearchMode } from '../../Core/Domain/Enums/WebSearchMode';
import { IChatCitation } from '../../Core/Domain/Entities/Definitions/IChatCitation';

export interface IWebSearchResult
{
  Citations: IChatCitation[];
  Context: string;
}

interface ISearchLink
{
  Title: string;
  Url: string;
  Snippet: string;
}

interface ISearchContent
{
  Title: string;
  Url: string;
  Content: string;
}

type SearchEngine = Exclude<WebSearchMode, 'off'>;

const SafariUserAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36';
const ChromeUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MaxQueries = 3;
const MaxResultsPerQuery = 5;
const MaxSnippetChars = 260;
const MaxContentChars = 8_000;
const MaxPageBytes = 1_400_000;
const ExtractionConcurrency = 4;
const EngineTimeoutMs = 20_000;
const ContentTimeoutMs = 25_000;
const ExcludedHosts = [
  'duckduckgo.com',
  'google.com',
  'bing.com',
  'startpage.com'
];

/** Builds the exact engine URL used by AIChat. */
function BuildSearchUrl(engine: SearchEngine, query: string): string
{
  const encoded = encodeURIComponent(query);
  switch (engine)
  {
    case 'google':
      return `https://www.google.com/search?q=${encoded}`;
    case 'bing':
      return `https://www.bing.com/search?q=${encoded}`;
    case 'duckduckgo':
      return `https://html.duckduckgo.com/html/?q=${encoded}`;
  }
}

/** Builds the hidden fallback order: selected, DuckDuckGo, then the rest. */
function BuildFallbackOrder(selected: SearchEngine): SearchEngine[]
{
  const order: SearchEngine[] = [selected];
  if (selected !== 'duckduckgo')
  {
    order.push('duckduckgo');
  }

  for (const engine of ['bing', 'duckduckgo', 'google'] as SearchEngine[])
  {
    if (engine !== selected && engine !== 'duckduckgo')
    {
      order.push(engine);
    }
  }

  return order;
}

/** Runs up to three queries and returns citations plus reference context. */
export async function SearchWebAsync(
  mode: Exclude<WebSearchMode, 'off'>,
  queries: string[],
  signal: AbortSignal
): Promise<IWebSearchResult>
{
  const sanitizedQueries = queries
    .map((query) => query.trim())
    .filter((query) => query.length > 0)
    .slice(0, MaxQueries);

  if (sanitizedQueries.length === 0)
  {
    return { Citations: [], Context: '' };
  }

  const settled = await Promise.allSettled(
    sanitizedQueries.map(async (query) =>
    {
      if (signal.aborted)
      {
        throw new Error('The search was stopped.');
      }

      const links = await SearchLinksWithFallbackAsync(mode, query, signal);
      return FetchPageContentsAsync(links, TokenizeSearchQuery(query), signal);
    })
  );

  const contents: ISearchContent[] = [];
  const seenUrls = new Set<string>();
  for (const outcome of settled)
  {
    if (outcome.status === 'rejected')
    {
      if (signal.aborted)
      {
        throw outcome.reason;
      }
      continue;
    }

    for (const content of outcome.value)
    {
      if (!seenUrls.has(content.Url))
      {
        seenUrls.add(content.Url);
        contents.push(content);
      }
    }
  }

  const citations: IChatCitation[] = [];
  const contexts: string[] = [];
  let index = 0;
  for (const result of contents)
  {
    if (!result.Content)
    {
      continue;
    }

    index += 1;
    const snippet = result.Content.slice(0, MaxSnippetChars);
    citations.push({
      Index: index,
      Title: result.Title || ReadHostname(result.Url),
      Url: result.Url,
      Snippet: snippet
    });
    contexts.push(
      `[${index}] ${result.Title || HostnameFallback(result.Url)}\nURL: ${result.Url}\n${result.Content.slice(0, MaxContentChars)}`
    );
  }

  return {
    Citations: citations,
    Context: contexts.join('\n\n')
  };
}

/** Tries the selected engine and then the hidden fallback order. */
async function SearchLinksWithFallbackAsync(
  selected: SearchEngine,
  query: string,
  signal: AbortSignal
): Promise<ISearchLink[]>
{
  for (const engine of BuildFallbackOrder(selected))
  {
    if (signal.aborted)
    {
      throw new Error('The search was stopped.');
    }

    try
    {
      const links = await SearchEngineAsync(engine, query, signal);
      if (links.length > 0)
      {
        return links;
      }
    }
    catch (error)
    {
      if (signal.aborted)
      {
        throw error;
      }
    }
  }

  console.warn(`Web search found no relevant results for the ${selected} engine.`);
  return [];
}

/** Fetches one engine results page and extracts organic links. */
async function SearchEngineAsync(
  engine: SearchEngine,
  query: string,
  signal: AbortSignal
): Promise<ISearchLink[]>
{
  const response = await fetch(
    BuildSearchUrl(engine, query),
    {
      headers: {
        'User-Agent': SafariUserAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml'
      },
      redirect: 'follow',
      signal: AbortSignal.any([signal, AbortSignal.timeout(EngineTimeoutMs)]),
      cache: 'no-store'
    }
  );

  if (!response.ok)
  {
    return [];
  }

  const html = await response.text();
  if (!html || IsSearchChallengePage(html))
  {
    return [];
  }

  let links: ISearchLink[] = [];
  const dom = new JSDOM(html, { url: response.url });
  try
  {
    switch (engine)
    {
      case 'google':
        links = ExtractGoogleLinks(dom.window.document);
        break;
      case 'bing':
        links = ExtractBingLinks(dom.window.document);
        break;
      case 'duckduckgo':
        links = ExtractDuckDuckGoLinks(dom.window.document);
        break;
    }
  }
  finally
  {
    dom.window.close();
  }

  const relevant = FilterRelevantLinks(links, query);
  if (links.length > 0 && relevant.length === 0)
  {
    const hosts = links
      .slice(0, 3)
      .map((link) => ReadHostname(link.Url))
      .join(', ');
    console.warn(`Web search ignored irrelevant ${engine} results from: ${hosts}`);
  }

  return relevant;
}

/** Extracts Google organic results. Google often returns a JS shell to Node, which triggers fallback. */
function ExtractGoogleLinks(document: Document): ISearchLink[]
{
  const links: ISearchLink[] = [];
  for (const item of document.querySelectorAll('#search .MjjYud'))
  {
    const title = item.querySelector('h3')?.textContent?.trim() ?? '';
    const href = item.querySelector('a')?.getAttribute('href') ?? '';
    const url = NormalizeResultUrl(href, 'https://www.google.com');
    if (title && url)
    {
      links.push({ Title: title, Url: url, Snippet: '' });
    }
    if (links.length >= MaxResultsPerQuery)
    {
      break;
    }
  }

  return links;
}

/** Extracts Bing organic results and decodes its redirect links. */
function ExtractBingLinks(document: Document): ISearchLink[]
{
  const links: ISearchLink[] = [];
  for (const heading of document.querySelectorAll('#b_results h2'))
  {
    const anchor = heading.querySelector('a');
    if (!anchor)
    {
      continue;
    }

    const title = anchor.textContent?.trim() ?? '';
    const url = NormalizeResultUrl(anchor.getAttribute('href') ?? '', 'https://www.bing.com');
    if (!title || !url)
    {
      continue;
    }

    const item = heading.closest('li');
    const snippet = item?.querySelector('.b_caption p')?.textContent?.trim() ?? '';
    links.push({ Title: title, Url: url, Snippet: snippet });
    if (links.length >= MaxResultsPerQuery)
    {
      break;
    }
  }

  return links;
}

/** Extracts DuckDuckGo HTML results, skipping sponsored rows. */
function ExtractDuckDuckGoLinks(document: Document): ISearchLink[]
{
  const links: ISearchLink[] = [];
  for (const item of document.querySelectorAll('#links .result'))
  {
    if (item.classList.contains('result--ad'))
    {
      continue;
    }

    const anchor = item.querySelector('.result__a');
    if (!anchor)
    {
      continue;
    }

    const title = anchor.textContent?.trim() ?? '';
    const url = NormalizeResultUrl(anchor.getAttribute('href') ?? '', 'https://duckduckgo.com');
    if (!title || !url)
    {
      continue;
    }

    const snippet = item.querySelector('.result__snippet')?.textContent?.trim() ?? '';
    links.push({ Title: title, Url: url, Snippet: snippet });
    if (links.length >= MaxResultsPerQuery)
    {
      break;
    }
  }

  return links;
}

/** Normalizes Turkish and Latin text so query terms can be compared. */
function NormalizeSearchText(value: string): string
{
  return value
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Returns the distinct terms of a search query. */
function TokenizeSearchQuery(query: string): string[]
{
  const tokens = NormalizeSearchText(query)
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  return [...new Set(tokens)];
}

/** Returns true when two normalized terms share a meaningful stem. */
function SearchTokensMatch(left: string, right: string): boolean
{
  if (left === right)
  {
    return true;
  }

  if (left.length >= 4 && right.startsWith(left))
  {
    return true;
  }

  if (right.length >= 4 && left.startsWith(right))
  {
    return true;
  }

  return false;
}

/** Counts how many query terms occur in one result text. */
function CountMatchingSearchTokens(value: string, queryTokens: string[]): number
{
  if (queryTokens.length === 0)
  {
    return 0;
  }

  const resultTokens = NormalizeSearchText(value)
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  let matches = 0;
  for (const queryToken of queryTokens)
  {
    if (resultTokens.some((resultToken) => SearchTokensMatch(queryToken, resultToken)))
    {
      matches += 1;
    }
  }

  return matches;
}

/** Returns true when a result is close enough to the query to be cited. */
function IsRelevantSearchText(value: string, queryTokens: string[]): boolean
{
  if (queryTokens.length === 0)
  {
    return true;
  }

  const required = queryTokens.length <= 2
    ? 1
    : Math.max(2, Math.ceil(queryTokens.length / 2));

  return CountMatchingSearchTokens(value, queryTokens) >= required;
}

/** Drops engine results that do not mention the query terms. */
function FilterRelevantLinks(links: ISearchLink[], query: string): ISearchLink[]
{
  const queryTokens = TokenizeSearchQuery(query);
  if (queryTokens.length === 0)
  {
    return links;
  }

  return links.filter((link) =>
  {
    const haystack = `${link.Title} ${link.Snippet} ${link.Url}`;
    return IsRelevantSearchText(haystack, queryTokens);
  });
}

/** Detects bot checks and consent shells that contain no organic results. */
function IsSearchChallengePage(html: string): boolean
{
  const sample = html.slice(0, 60_000).toLowerCase();
  return [
    'captcha',
    'verify you are human',
    'verifying you are human',
    'unusual traffic',
    'bots use duckduckgo',
    'anomaly-modal',
    'enablejs',
    'access denied'
  ].some((marker) => sample.includes(marker));
}

/** Resolves engine redirects, removes tracking parameters, and rejects non-organic hosts. */
function NormalizeResultUrl(rawUrl: string, baseUrl: string): string
{
  if (!rawUrl.trim())
  {
    return '';
  }

  try
  {
    const candidate = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
    const url = new URL(candidate, baseUrl);

    const duckDuckGoTarget = url.searchParams.get('uddg');
    if (duckDuckGoTarget)
    {
      return NormalizeResultUrl(decodeURIComponent(duckDuckGoTarget), baseUrl);
    }

    const bingTarget = url.searchParams.get('u');
    if (bingTarget?.startsWith('a1'))
    {
      const decoded = DecodeBase64Url(bingTarget.slice(2));
      if (decoded.startsWith('http'))
      {
        return NormalizeResultUrl(decoded, baseUrl);
      }
    }

    const googleTarget = url.searchParams.get('q') ?? url.searchParams.get('url');
    if (googleTarget?.startsWith('http'))
    {
      return NormalizeResultUrl(googleTarget, baseUrl);
    }

    if (!IsSafeRemoteUrl(url) || IsExcludedHost(url.hostname))
    {
      return '';
    }

    return url.toString();
  }
  catch
  {
    return '';
  }
}

/** Decodes Bing's base64url redirect target. */
function DecodeBase64Url(value: string): string
{
  try
  {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(normalized, 'base64').toString('utf8');
  }
  catch
  {
    return '';
  }
}

/** Rejects engine pages and non-public destinations. */
function IsExcludedHost(hostname: string): boolean
{
  const host = hostname.toLowerCase();
  return ExcludedHosts.some((excluded) =>
  {
    return host === excluded || host.endsWith(`.${excluded}`);
  });
}

/** Allows only public HTTP(S) pages. */
function IsSafeRemoteUrl(url: URL): boolean
{
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
  {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    hostname === 'localhost'
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal')
    || hostname === '::1'
    || hostname.startsWith('fc')
    || hostname.startsWith('fd')
    || hostname.startsWith('fe80')
  )
  {
    return false;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname))
  {
    const octets = hostname.split('.').map(Number);
    const [first, second] = octets;
    return !(
      first === 0
      || first === 10
      || first === 127
      || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168)
      || (first === 100 && second >= 64 && second <= 127)
    );
  }

  return true;
}

/** Downloads result pages with bounded concurrency. */
async function FetchPageContentsAsync(
  links: ISearchLink[],
  queryTokens: string[],
  signal: AbortSignal
): Promise<ISearchContent[]>
{
  const results: Array<ISearchContent | null> = new Array(links.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> =>
  {
    while (nextIndex < links.length)
    {
      const index = nextIndex;
      nextIndex += 1;
      const link = links[index];
      if (link)
      {
        results[index] = await FetchPageContentAsync(link, queryTokens, signal);
      }
    }
  };

  await Promise.allSettled(
    Array.from(
      { length: Math.min(ExtractionConcurrency, links.length) },
      () => worker()
    )
  );

  return results.filter((result): result is ISearchContent => result !== null);
}

/** Fetches one result page and extracts readable markdown, falling back to its engine snippet. */
async function FetchPageContentAsync(
  link: ISearchLink,
  queryTokens: string[],
  signal: AbortSignal
): Promise<ISearchContent | null>
{
  if (signal.aborted)
  {
    throw new Error('The search was stopped.');
  }

  try
  {
    const url = new URL(link.Url);
    if (!IsSafeRemoteUrl(url))
    {
      return null;
    }

    const response = await fetch(
      link.Url,
      {
        headers: {
          'User-Agent': ChromeUserAgent,
          'Accept-Language': 'en-US,en;q=0.9',
          Accept: 'text/html,application/xhtml+xml'
        },
        redirect: 'follow',
        signal: AbortSignal.any([signal, AbortSignal.timeout(ContentTimeoutMs)]),
        cache: 'no-store'
      }
    );

    if (!response.ok || !IsSafeRemoteUrl(new URL(response.url)))
    {
      return BuildSnippetResult(link, queryTokens);
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType && !contentType.includes('html') && !contentType.includes('text/plain'))
    {
      return BuildSnippetResult(link, queryTokens);
    }

    const html = await ReadBoundedTextAsync(response, MaxPageBytes);
    const extracted = ExtractReadableContent(html, response.url);
    if (!extracted || !IsRelevantSearchText(extracted.Content, queryTokens))
    {
      return BuildSnippetResult(link, queryTokens);
    }

    return {
      Title: extracted.Title || link.Title,
      Url: link.Url,
      Content: extracted.Content.slice(0, MaxContentChars)
    };
  }
  catch (error)
  {
    if (signal.aborted)
    {
      throw error;
    }

    return BuildSnippetResult(link, queryTokens);
  }
}

/** Uses the search-engine snippet when a page cannot be read. */
function BuildSnippetResult(
  link: ISearchLink,
  queryTokens: string[]
): ISearchContent | null
{
  const content = NormalizeWhitespace(link.Snippet);
  if (!content || !IsRelevantSearchText(content, queryTokens))
  {
    return null;
  }

  return {
    Title: link.Title,
    Url: link.Url,
    Content: content
  };
}

/** Extracts the main article as markdown with Readability and Turndown. */
function ExtractReadableContent(
  html: string,
  url: string
): { Title: string; Content: string } | null
{
  if (!html.trim())
  {
    return null;
  }

  const dom = new JSDOM(html, { url });
  try
  {
    const article = new Readability(dom.window.document).parse();
    if (!article?.content)
    {
      return null;
    }

    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    turndown.remove(['script', 'style', 'noscript', 'iframe', 'form', 'button']);
    const markdown = NormalizeWhitespace(turndown.turndown(article.content));
    if (!markdown)
    {
      return null;
    }

    return {
      Title: article.title?.trim() ?? '',
      Content: markdown
    };
  }
  finally
  {
    dom.window.close();
  }
}

/** Reads at most maxBytes from one response body. */
async function ReadBoundedTextAsync(response: Response, maxBytes: number): Promise<string>
{
  if (!response.body)
  {
    return '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';

  while (received < maxBytes)
  {
    const chunk = await reader.read();
    if (chunk.done)
    {
      break;
    }

    received += chunk.value.byteLength;
    text += decoder.decode(chunk.value, { stream: true });
  }

  if (received >= maxBytes)
  {
    await reader.cancel();
  }

  return `${text}${decoder.decode()}`.slice(0, maxBytes);
}

/** Collapses redundant whitespace without flattening deliberate markdown structure. */
function NormalizeWhitespace(value: string): string
{
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extracts a hostname for citation titles. */
function ReadHostname(value: string): string
{
  try
  {
    return new URL(value).hostname;
  }
  catch
  {
    return value;
  }
}

/** Returns a stable fallback title for malformed URLs. */
function HostnameFallback(value: string): string
{
  return ReadHostname(value) || value;
}
