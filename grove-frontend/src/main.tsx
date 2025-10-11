import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import faviconUrl from '@/assets/favicon.png';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// set favicon dynamically from bundled asset
const faviconEl = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
if (faviconEl) {
  faviconEl.href = faviconUrl;
}
