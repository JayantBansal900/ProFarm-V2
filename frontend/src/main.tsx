import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';
import { initializeLocalization } from './i18n';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Fatal: #root element not found in DOM');
}

void initializeLocalization().then(() => {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
