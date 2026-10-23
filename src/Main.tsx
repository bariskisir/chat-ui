import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './Presentation/Styles/Main.scss';

if (typeof document !== 'undefined')
{
  document.addEventListener(
    'gesturestart',
    (event: Event) =>
    {
      event.preventDefault();
    },
    { passive: false }
  );
}

const rootElement = document.getElementById('root');

if (rootElement)
{
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
