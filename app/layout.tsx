import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './../src/Presentation/Styles/Main.scss';

const ThemeBootstrapScript = `
(() =>
{
  const storageKey = 'cui_theme_mode_v1';
  let theme = 'dark';

  try
  {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'dark' || stored === 'light')
    {
      theme = stored;
    }
  }
  catch
  {
    // Storage can be unavailable in restricted browsing modes.
  }

  const root = document.documentElement;
  root.setAttribute('data-cui-theme', theme);
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
  root.style.backgroundColor = theme === 'dark' ? 'oklch(0.145 0 0)' : 'oklch(0.97 0 89.876)';
  root.style.colorScheme = theme;
})();
`;

export const metadata: Metadata =
{
  title: 'Chat UI',
  description: 'A focused chat interface for Mock and OpenAI-compatible models.',
  icons:
  {
    icon: '/favicon.svg'
  }
};

export const viewport: Viewport =
{
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'dark light',
  themeColor: '#171717'
};

export default function RootLayout({ children }: { children: ReactNode })
{
  return (
    <html
      lang="en"
      data-cui-theme="dark"
      className="theme-dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ThemeBootstrapScript }} />
        <style
          dangerouslySetInnerHTML={{
            __html: 'html,body{background-color:oklch(0.145 0 0);}'
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
