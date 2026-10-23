import { ChatRequestDto } from '../DTOs/ChatRequestDto';
import { StreamCallbacksDto } from '../DTOs/StreamCallbacksDto';

export interface IChatService
{
  StreamMessageAsync(
    request: ChatRequestDto,
    callbacks: StreamCallbacksDto
  ): Promise<void>;
}
