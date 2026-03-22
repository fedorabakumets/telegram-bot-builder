/**
 * @fileoverview Setup файл для тестов с Testing Library
 * Добавляет кастомные матчеры jest-dom и настраивает моки
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Глобальный мок для fetch
global.fetch = vi.fn();

// Следующие моки нужны только в jsdom окружении
if (typeof window !== 'undefined') {
  // Мок для matchMedia (требуется для некоторых компонентов)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Мок для window.scrollTo
  window.scrollTo = vi.fn(() => {});
}

// Мок для requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  setTimeout(() => callback(0), 0);
  return 0;
});
