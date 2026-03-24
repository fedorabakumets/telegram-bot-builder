/**
 * @fileoverview Тесты для helper-функций клавиатурной связи message -> keyboard
 *
 * Проверяет отдельный контракт:
 * - связь разрешена только между `message` и `keyboard`
 * - `keyboardNodeId` читается и очищается без ad-hoc доступа по компонентам
 *
 * @module keyboard-connection.test
 */

import { describe, expect, it } from 'vitest';
import {
  clearKeyboardNodeId,
  getKeyboardNodeId,
  isKeyboardConnectionAllowed,
  setKeyboardNodeId,
} from '../canvas-node/keyboard-connection';

describe('keyboard connection helpers', () => {
  it('разрешает только связь message -> keyboard', () => {
    expect(isKeyboardConnectionAllowed('message', 'keyboard')).toBe(true);
    expect(isKeyboardConnectionAllowed('message', 'message')).toBe(false);
    expect(isKeyboardConnectionAllowed('condition', 'keyboard')).toBe(false);
    expect(isKeyboardConnectionAllowed('keyboard', 'message')).toBe(false);
    expect(isKeyboardConnectionAllowed('command', 'keyboard')).toBe(false);
  });

  it('читает keyboardNodeId только из валидных данных', () => {
    expect(getKeyboardNodeId({ keyboardNodeId: 'keyboard-1' })).toBe('keyboard-1');
    expect(getKeyboardNodeId({ keyboardNodeId: '' })).toBeNull();
    expect(getKeyboardNodeId({ keyboardNodeId: 123 })).toBeNull();
    expect(getKeyboardNodeId(undefined)).toBeNull();
  });

  it('добавляет и очищает keyboardNodeId без потери остальных полей', () => {
    const data = { text: 'hello', keyboardType: 'inline' };
    const linked = setKeyboardNodeId(data, 'keyboard-1');
    expect(linked.keyboardNodeId).toBe('keyboard-1');
    expect(linked.text).toBe('hello');

    const cleared = clearKeyboardNodeId(linked);
    expect(getKeyboardNodeId(cleared)).toBeNull();
    expect(cleared.text).toBe('hello');
    expect(cleared.keyboardType).toBe('inline');
  });
});
