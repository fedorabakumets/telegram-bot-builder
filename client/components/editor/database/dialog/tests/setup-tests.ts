/**
 * @fileoverview Setup файл для тестов с Testing Library
 * Добавляет кастомные матчеры jest-dom
 */

import '@testing-library/jest-dom/vitest';

// Глобальная настройка для всех тестов
if (typeof global !== 'undefined') {
  // Устанавливаем заглушку для fetch если не существует
  if (!global.fetch) {
    global.fetch = vi.fn();
  }
}
