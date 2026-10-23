import { FC } from 'react';
import { ThemeProvider } from './Presentation/Providers/Implementations/ThemeProvider';
import { ModelProvider } from './Presentation/Providers/Implementations/ModelProvider';
import { ChatProvider } from './Presentation/Providers/Implementations/ChatProvider';
import { AppShell } from './Presentation/Components/Layout/Implementations/AppShell';

export const App: FC = () =>
{
  return (
    <ThemeProvider>
      <ModelProvider>
        <ChatProvider>
          <AppShell />
        </ChatProvider>
      </ModelProvider>
    </ThemeProvider>
  );
};
