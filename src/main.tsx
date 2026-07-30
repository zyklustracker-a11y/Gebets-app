import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './styles/global.css';

const wurzel = document.getElementById('root');
if (!wurzel) throw new Error('Element #root fehlt in index.html');

createRoot(wurzel).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
