import { IChatService } from '../../Application/Contracts/IChatService';
import { ChatRequestDto } from '../../Application/DTOs/ChatRequestDto';
import { StreamCallbacksDto } from '../../Application/DTOs/StreamCallbacksDto';
import { ModelIdentifier } from '../../Core/Domain/Enums/ModelIdentifier';

export class MockChatService implements IChatService
{
  private static readonly ResponseTexts: Record<ModelIdentifier, string> = {
    [ModelIdentifier.Model1]:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    [ModelIdentifier.Model2]:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
    [ModelIdentifier.Model3]:
      'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.'
  };

  public async StreamMessageAsync(
    request: ChatRequestDto,
    callbacks: StreamCallbacksDto
  ): Promise<void>
  {
    try
    {
      const fullText =
        MockChatService.ResponseTexts[request.Model] ||
        MockChatService.ResponseTexts[ModelIdentifier.Model1];

      const words = fullText.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++)
      {
        if (request.AbortSignal?.aborted)
        {
          break;
        }

        await this.DelayAsync(28);

        if (request.AbortSignal?.aborted)
        {
          break;
        }

        const token = (i === 0 ? '' : ' ') + words[i];
        currentText += token;
        callbacks.OnChunk(token);
      }

      callbacks.OnComplete(currentText);
    }
    catch (error)
    {
      callbacks.OnError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private DelayAsync(ms: number): Promise<void>
  {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
