import '@fontsource/inter/latin.css';
import '@fontsource/inter/latin-ext.css';
import 'katex/dist/katex.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import RootErrorBoundary from './components/RootErrorBoundary';
import './index.css';
import { registerServiceWorker } from './lib/registerServiceWorker';

registerServiceWorker();

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>,
  );
}
