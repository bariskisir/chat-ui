'use client';

import dynamic from 'next/dynamic';

const App = dynamic(
  () => import('../src/App').then((module) => module.App),
  {
    ssr: false,
    loading: () => (
      <div className="cui-app-loading" aria-label="Loading Chat UI">
        <span className="cui-app-loading__pulse" />
      </div>
    )
  }
);

interface IAppLoaderProps
{
  webSearchEnabled: boolean;
}

/** Loads the browser-only app with server-provided feature flags. */
export function AppLoader({ webSearchEnabled }: IAppLoaderProps)
{
  return <App webSearchEnabled={webSearchEnabled} />;
}
