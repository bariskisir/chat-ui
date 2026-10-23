import { FC } from 'react';
import { ThemeProvider } from './Presentation/Providers/Implementations/ThemeProvider';
import { ModelProvider } from './Presentation/Providers/Implementations/ModelProvider';
import { ChatProvider } from './Presentation/Providers/Implementations/ChatProvider';
import { AppShell } from './Presentation/Components/Layout/Implementations/AppShell';
import { CreateChatService, CreateModelRepository } from './Infrastructure/Composition/ApplicationComposition';

const chatService = CreateChatService();
const modelRepository = CreateModelRepository();

export const App: FC = () =>
{
  return (
    <ThemeProvider>
      <ModelProvider repository={modelRepository}>
        <ChatProvider chatService={chatService}>
          <AppShell />
        </ChatProvider>
      </ModelProvider>
    </ThemeProvider>
  );
};
