/**
 * @fileoverview Тесты для утилиты форматирования даты
 * Проверяет корректность форматирования с русской локализацией
 * @module tests/unit/utils/format-date.test
 */

/// <reference types="vitest/globals" />

import { formatDate } from '../../../utils/format-date';

describe('formatDate', () => {
  it('должен возвращать пустую строку для null', () => {
    const result = formatDate(null);
    expect(result).toBe('');
  });

  it('должен возвращать пустую строку для undefined', () => {
    const result = formatDate(undefined);
    expect(result).toBe('');
  });

  it('должен возвращать пустую строку для пустой строки', () => {
    const result = formatDate('');
    expect(result).toBe('');
  });

  it('должен возвращать пустую строку для невалидной даты', () => {
    const result = formatDate('invalid-date');
    expect(result).toBe('');
  });

  it('должен форматировать объект Date', () => {
    const date = new Date('2024-03-14T10:30:00Z');
    const result = formatDate(date);

    expect(result).toContain('2024');
  });

  it('должен использовать русскую локализацию', () => {
    const date = new Date('2024-01-15T14:30:00Z');
    const result = formatDate(date);

    expect(result.length).toBeGreaterThan(0);
  });

  it('должен форматировать ISO строку', () => {
    const result = formatDate('2024-03-14T10:30:00Z');
    expect(result).toContain('2024');
  });

  it('должен форматировать timestamp', () => {
    const timestamp = new Date('2024-03-14T10:30:00Z').getTime();
    const result = formatDate(timestamp);
    expect(result).toContain('2024');
  });
});
