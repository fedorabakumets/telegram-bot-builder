/**
 * Настройка тестовой среды
 */

import { vi } from 'vitest';

// Мокаем console.log для тестов
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Мокаем performance API если он недоступен
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: vi.fn(() => Date.now()),
  } as any;
}