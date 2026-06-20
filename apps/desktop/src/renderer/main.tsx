import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { ensureNekko } from './web-client.js';
import './styles.css';

// In Electron the preload bridge already defined window.nekko; in the web/Docker
// editions this installs the HTTP/WS client. Either way the UI below is identical.
ensureNekko();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
