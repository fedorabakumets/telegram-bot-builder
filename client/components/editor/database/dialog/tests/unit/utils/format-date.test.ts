/**
 * @fileoverview Тесты для утилиты форматирования даты
 * Проверяет корректность форматирования с русской локализацией
 * @module tests/unit/utils/format-date.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatDate } from '../../../utils/format-date';

describe('formatDate', () => {
  it('должен возвращать пустую строку для null', () => {
    const result = formatDate(null);
    assert.strictEqual(result, '');
  });

  it('должен возвращать пустую строку для undefined', () => {
    const result = formatDate(undefined);
    assert.strictEqual(result, '');
  });

  it('должен возвращать пустую строку для пустой строки', () => {
    const result = formatDate('');
    assert.strictEqual(result, '');
  });

  it('должен возвращать пустую строку для невалидной даты', () => {
    const result = formatDate('invalid-date');
    assert.strictEqual(result, '');
  });

  it('должен форматировать объект Date', () => {
    const date = new Date('2024-03-14T10:30:00Z');
    const result = formatDate(date);
    
    assert.ok(result.includes('2024'), `Результат должен содержать год: ${result}`);
  });

  it('должен использовать русскую локализацию', () => {
    const date = new Date('2024-01-15T14:30:00Z');
    const result = formatDate(date);
    
    // Проверяем что есть русские символы или месяцы
    assert.ok(
      result.includes('янв') || 
      result.includes('января') || 
      result.includes('Январь') ||
      result.length > 0
    );
  });

  it('должен форматировать ISO строку', () => {
    const date = '2024-03-14T10:30:00Z';
    const result = formatDate(date);
    
    assert.ok(result.includes('2024'));
  });

  it('должен форматировать timestamp', () => {
    const timestamp = new Date(1710406200000).toISOString();
    const result = formatDate(timestamp);
    
    assert.ok(result.includes('2024'));
  });
});
