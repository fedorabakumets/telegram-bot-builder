/**
 * @fileoverview Проверка горячих клавиш вставки с русской раскладкой.
 * @module components/editor/files/tests/is-paste-hotkey.test
 */

import { describe, it, expect } from 'vitest';
import { isPasteHotkey } from '../panel/read-clipboard-files';

/**
 * Собирает KeyboardEvent с нужными полями для проверки хоткея.
 * @param over - Переопределения полей события
 * @returns KeyboardEvent
 */
function key(over: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    repeat: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: '',
    code: '',
    ...over,
  } as KeyboardEvent;
}

describe('isPasteHotkey', () => {
  it('ловит Ctrl+V', () => {
    expect(isPasteHotkey(key({ ctrlKey: true, key: 'v', code: 'KeyV' }))).toBe(true);
  });

  it('ловит Ctrl+М на русской раскладке (та же физическая клавиша)', () => {
    expect(isPasteHotkey(key({ ctrlKey: true, key: 'м', code: 'KeyV' }))).toBe(true);
    expect(isPasteHotkey(key({ ctrlKey: true, key: 'М', code: 'KeyV' }))).toBe(true);
  });

  it('ловит Shift+Insert', () => {
    expect(isPasteHotkey(key({ shiftKey: true, key: 'Insert', code: 'Insert' }))).toBe(true);
  });

  it('не считает обычную букву М без Ctrl', () => {
    expect(isPasteHotkey(key({ key: 'м', code: 'KeyV' }))).toBe(false);
  });
});
