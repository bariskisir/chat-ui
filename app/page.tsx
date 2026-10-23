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

export default function Page()
{
  return <App />;
}
