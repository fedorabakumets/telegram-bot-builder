/**
 * @fileoverview Тесты для утилиты нормализации имени файла
 * @module client/utils/tests/normalize-file-name.test
 */

import { describe, it, expect } from 'vitest';
import { normalizeProjectNameToFile } from '../normalize-file-name';

describe('normalizeProjectNameToFile', () => {
  it('переводит в нижний регистр', () => {
    expect(normalizeProjectNameToFile('MyBot')).toBe('mybot');
  });

  it('заменяет пробелы на подчёркивания', () => {
    expect(normalizeProjectNameToFile('my bot')).toBe('my_bot');
  });

  it('удаляет недопустимые символы', () => {
    expect(normalizeProjectNameToFile('my!bot@#')).toBe('mybot');
  });

  it('убирает множественные подчёркивания', () => {
    expect(normalizeProjectNameToFile('my   bot')).toBe('my_bot');
  });

  it('убирает пробелы по краям', () => {
    expect(normalizeProjectNameToFile('  mybot  ')).toBe('mybot');
  });

  it('убирает дефисы в начале и конце', () => {
    expect(normalizeProjectNameToFile('-mybot-')).toBe('mybot');
  });

  it('возвращает unnamed_bot для пустой строки', () => {
    expect(normalizeProjectNameToFile('')).toBe('unnamed_bot');
  });

  it('возвращает unnamed_bot для строки только из спецсимволов', () => {
    expect(normalizeProjectNameToFile('!@#$%')).toBe('unnamed_bot');
  });

  it('обрезает имя до 100 символов', () => {
    const long = 'a'.repeat(150);
    expect(normalizeProjectNameToFile(long).length).toBe(100);
  });

  it('сохраняет кириллицу', () => {
    const result = normalizeProjectNameToFile('Мой бот');
    expect(result).toBe('мой_бот');
  });

  it('корректно обрабатывает имя начинающееся с точки', () => {
    // Точка удаляется как спецсимвол, остаётся "hidden"
    const result = normalizeProjectNameToFile('.hidden');
    expect(result).toBe('hidden');
  });

  it('добавляет префикс если имя начинается с подчёркивания', () => {
    const result = normalizeProjectNameToFile('_private');
    expect(result.startsWith('file')).toBe(true);
  });
});
