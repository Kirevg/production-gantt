import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ============= УДАЛЁННОЕ ЛОГИРОВАНИЕ КОНСОЛИ =============
// Перехватываем все логи браузера и отправляем на сервер
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Функция для отправки лога на сервер
const sendLogToServer = (level: 'log' | 'info' | 'warn' | 'error', args: any[]) => {
  try {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const logData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      stack: level === 'error' && args[0] instanceof Error ? args[0].stack : undefined
    };

    // Используем navigator.sendBeacon для надёжной отправки
    // Даже если страница закрывается, лог всё равно отправится
    const blob = new Blob([JSON.stringify(logData)], { type: 'application/json' });
    navigator.sendBeacon(`${API_BASE_URL}/api/client-logs`, blob);
  } catch (err) {
    // Тихо игнорируем ошибки логирования, чтобы не создавать цикл
  }
};

// Сохраняем оригинальные методы консоли
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

// Переопределяем console.log
console.log = function (...args: any[]) {
  originalConsole.log.apply(console, args);
  sendLogToServer('log', args);
};

// Переопределяем console.info
console.info = function (...args: any[]) {
  originalConsole.info.apply(console, args);
  sendLogToServer('info', args);
};

// Переопределяем console.warn
console.warn = function (...args: any[]) {
  originalConsole.warn.apply(console, args);
  sendLogToServer('warn', args);
};

// Переопределяем console.error
console.error = function (...args: any[]) {
  originalConsole.error.apply(console, args);
  sendLogToServer('error', args);
};

// Перехватываем необработанные ошибки
window.addEventListener('error', (event) => {
  sendLogToServer('error', [
    `Uncaught Error: ${event.message}`,
    `at ${event.filename}:${event.lineno}:${event.colno}`,
    event.error
  ]);
});

// Перехватываем необработанные Promise rejection
window.addEventListener('unhandledrejection', (event) => {
  sendLogToServer('error', [
    `Unhandled Promise Rejection: ${event.reason}`,
    event.reason
  ]);
});

console.log('🔍 Удалённое логирование консоли включено');
// ============= КОНЕЦ УДАЛЁННОГО ЛОГИРОВАНИЯ =============

// Предотвращаем применение aria-hidden к элементам с фокусом
// Это нарушает стандарты ARIA согласно спецификации WAI-ARIA
const rootElement = document.getElementById('root');
if (rootElement) {
  let lastWarningTime = 0;
  const WARNING_COOLDOWN = 10000; // 10 секунд между предупреждениями
  
  // Перехватываем попытки установки aria-hidden на корневой элемент
  const originalSetAttribute = rootElement.setAttribute;
  rootElement.setAttribute = function(name: string, value: string) {
    if (name === 'aria-hidden' && value === 'true' && this.id === 'root') {
      // Блокируем установку aria-hidden на корневой элемент
      const now = Date.now();
      if (now - lastWarningTime > WARNING_COOLDOWN) {
        console.warn('Blocked aria-hidden on root element to comply with ARIA standards');
        lastWarningTime = now;
      }
      return; // Не устанавливаем атрибут
    }
    return originalSetAttribute.call(this, name, value);
  };
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
        const target = mutation.target as HTMLElement;
        
        // Удаляем aria-hidden с корневого элемента (если все же проскочил)
        if (target.id === 'root' && target.getAttribute('aria-hidden') === 'true') {
          target.removeAttribute('aria-hidden');
        }
        
        // Проверяем, есть ли внутри элемента с aria-hidden фокусируемые элементы
        if (target.getAttribute('aria-hidden') === 'true') {
          const focusedElement = document.activeElement;
          if (focusedElement && target.contains(focusedElement)) {
            // Удаляем aria-hidden если внутри есть элемент с фокусом
            target.removeAttribute('aria-hidden');
            
            // Показываем предупреждение не чаще чем раз в 10 секунд
            const now = Date.now();
            if (now - lastWarningTime > WARNING_COOLDOWN) {
              console.warn(`Removed aria-hidden from ${target.className} because it contains focused element`);
              lastWarningTime = now;
            }
          }
        }
      }
    });
  });

  observer.observe(rootElement, {
    attributes: true,
    attributeFilter: ['aria-hidden'],
    subtree: true // Отслеживаем изменения во всех дочерних элементах
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
