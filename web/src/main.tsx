import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Предотвращаем применение aria-hidden к корневому элементу
// Это нарушает стандарты ARIA согласно спецификации WAI-ARIA
const rootElement = document.getElementById('root');
if (rootElement) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
        const target = mutation.target as HTMLElement;
        if (target.id === 'root' && target.getAttribute('aria-hidden') === 'true') {
          // Немедленно удаляем aria-hidden с корневого элемента
          target.removeAttribute('aria-hidden');
          console.warn('Removed aria-hidden from root element to comply with ARIA standards');
        }
      }
    });
  });

  observer.observe(rootElement, {
    attributes: true,
    attributeFilter: ['aria-hidden']
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
