export type OpenCodeChatRole = 'system' | 'user' | 'assistant';

export interface IOpenCodeChatMessageDto
{
  role: OpenCodeChatRole;
  content: string;
}
