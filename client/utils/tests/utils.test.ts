/**
 * @fileoverview Тесты для утилиты cn (объединение классов)
 * @module client/utils/tests/utils.test
 */

import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('объединяет несколько классов', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('игнорирует falsy значения', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('поддерживает условные классы через объект', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });

  it('мержит конфликтующие tailwind классы (последний побеждает)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('возвращает пустую строку если нет классов', () => {
    expect(cn()).toBe('');
  });

  it('поддерживает массивы классов', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });
});
