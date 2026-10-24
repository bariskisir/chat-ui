/** Lists the search engines the composer can use for current web results. */
export const WebSearchModes = ['off', 'google', 'bing', 'duckduckgo'] as const;

/** Identifies one search engine or the disabled state. */
export type WebSearchMode = (typeof WebSearchModes)[number];

/** Identifies a search engine that can run a query. */
export type WebSearchEngine = Exclude<WebSearchMode, 'off'>;

/** Returns true when a value identifies a supported search engine setting. */
export function IsWebSearchMode(value: string): value is WebSearchMode
{
  return (WebSearchModes as readonly string[]).includes(value);
}
