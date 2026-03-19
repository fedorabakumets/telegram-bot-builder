/**
 * @fileoverview Setup файл для тестов sidebar
 * Настраивает окружение для тестирования компонентов
 * @module tests/setup-tests
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Делаем vi доступным глобально
(global as any).vi = vi;

// Глобальный мок для fetch
global.fetch = vi.fn();

// Полифилл для TouchEvent в jsdom
// jsdom не поддерживает TouchEvent по умолчанию
if (typeof global.TouchEvent === 'undefined') {
  global.TouchEvent = class TouchEvent extends Event {
    touches: any[] = [];
    changedTouches: any[] = [];
    targetTouches: any[] = [];
    altKey: boolean = false;
    ctrlKey: boolean = false;
    shiftKey: boolean = false;
    metaKey: boolean = false;

    constructor(type: string, eventInitDict?: EventInit & {
      touches?: any[];
      changedTouches?: any[];
      targetTouches?: any[];
    }) {
      super(type, eventInitDict);
      if (eventInitDict) {
        this.touches = eventInitDict.touches || [];
        this.changedTouches = eventInitDict.changedTouches || [];
        this.targetTouches = eventInitDict.targetTouches || [];
      }
    }
  };
}

// Моки для window.matchMedia
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

// Мок для requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  setTimeout(() => callback(0), 0);
  return 0;
});

// Моки для ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Моки для IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [];
  root = null;
  rootMargin = '';
  thresholds = [];
};

// Мок для document.elementFromPoint
Object.defineProperty(document, 'elementFromPoint', {
  writable: true,
  value: vi.fn(() => null),
});
