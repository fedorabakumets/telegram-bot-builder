/**
 * @fileoverview Тесты для утилиты форматирования даты
 * @module tests/unit/utils/format-date.test
 */

/// <reference types="vitest/globals" />

import { formatDate } from '../../../handlers/format-date';

describe('formatDate', () => {
  it('должен возвращать "Неизвестно" для null', () => {
    const result = formatDate(null);
    expect(result).toBe('Неизвестно');
  });

  it('должен возвращать "Неизвестно" для undefined', () => {
    const result = formatDate(undefined as any);
    expect(result).toBe('Неизвестно');
  });

  it('должен возвращать "Неизвестно" для пустой строки', () => {
    const result = formatDate('');
    expect(result).toBe('Неизвестно');
  });

  it('должен форматировать объект Date', () => {
    const date = new Date('2024-03-14T10:30:00Z');
    const result = formatDate(date);
    
    expect(result).toContain('2024');
    expect(result.length).toBeGreaterThan(0);
  });

  it('должен форматировать ISO строку', () => {
    const result = formatDate('2024-03-14T10:30:00Z');
    expect(result).toContain('2024');
  });

  it('должен использовать русскую локализацию (DD.MM.YYYY, HH:mm)', () => {
    const result = formatDate('2024-01-15T14:30:00Z');
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/);
  });

  it('должен возвращать "Неизвестно" для невалидной даты', () => {
    const result = formatDate('invalid-date');
    expect(result).toBe('Неизвестно');
  });

  it('должен форматировать timestamp', () => {
    const timestamp = new Date('2024-03-14T10:30:00Z').getTime();
    const result = formatDate(timestamp);
    expect(result).toContain('2024');
  });
});
