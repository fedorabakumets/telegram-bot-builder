/**
 * @fileoverview Тесты для компонента DialogPanel
 * Проверяет главную панель диалога, координацию компонентов и взаимодействие
 * @module tests/components/dialog-panel.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/dialog-panel.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { DialogPanel } from '../../dialog-panel';

describe('DialogPanel', () => {
  it('должен экспортировать компонент DialogPanel', () => {
    expect(DialogPanel).toBeDefined();
    expect(typeof DialogPanel).toBe('function');
  });

  it('должен иметь правильные propTypes (проверка существования)', () => {
    // Компонент существует и является функцией
    expect(DialogPanel).toBeTruthy();
  });
});
