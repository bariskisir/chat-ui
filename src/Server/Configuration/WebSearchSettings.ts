/**
 * Reads the deployment-level switch for web search.
 * The feature stays enabled when the variable is missing.
 */
export function IsWebSearchEnabled(): boolean
{
  const value = process.env.WEB_SEARCH_ENABLE?.trim().toLowerCase();
  return value !== 'false';
}
