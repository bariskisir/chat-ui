export type OpenAIChatRole = 'system' | 'user' | 'assistant';

export interface IOpenAIChatMessageDto
{
  role: OpenAIChatRole;
  content: string;
}
