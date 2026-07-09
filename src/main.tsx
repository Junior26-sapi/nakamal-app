import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import './index.css';
import { hapticUtility } from './utils/haptics';

// Anti-clutter Vercel toolbar removal and layout pristine safety
if (typeof window !== 'undefined') {
  // 1. Opt-out flag
  (window as any).__VERCEL_TOOLBAR_DISABLED__ = true;

  // 2. Continuous cleanup to ensure no unrequested toolbars or feedback elements render
  const cleanupVercelToolbar = () => {
    const selectors = [
      'vercel-developer-tools',
      'vercel-live-feedback',
      '#vercel-live-feedback',
      '#vercel-developer-tools',
      '.vercel-developer-tools'
    ];
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.remove();
        });
      } catch (e) {}
    });
  };

  // Run immediately and setup observer
  cleanupVercelToolbar();
  const observer = new MutationObserver(cleanupVercelToolbar);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Secondary backup polling
  setInterval(cleanupVercelToolbar, 500);
}

// Initialize global tactile haptic feedback for all buttons & interactive controls
hapticUtility.initButtonHaptics();

// Register service worker for offline notification tracking
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered successfully in scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </LanguageProvider>
  </StrictMode>,
);

