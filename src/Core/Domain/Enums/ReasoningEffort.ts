/** Lists the fixed reasoning levels offered by OpenAI-compatible providers. */
export const ReasoningEfforts = [
  'off',
  'default',
  'low',
  'medium',
  'high',
  'xhigh'
] as const;

/** Identifies one reasoning effort sent with a chat request. */
export type ReasoningEffort = (typeof ReasoningEfforts)[number];

/** Returns true when a value is one of the fixed reasoning levels. */
export function IsReasoningEffort(value: string): value is ReasoningEffort
{
  return (ReasoningEfforts as readonly string[]).includes(value);
}
