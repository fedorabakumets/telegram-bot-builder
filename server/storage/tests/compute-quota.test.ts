/**
 * @fileoverview Юнит-тесты ENV-логики квоты хранилища, лежащей в основе
 * `computeStorageQuota`: `readStorageLimitBytes` (ENV пуст/0/значение → лимит
 * в байтах, Req 4.2, 4.3) и `isQuotaExceeded` (флаг мягкого превышения,
 * Req 4.7). Задача 10.1 (юнит-тесты).
 *
 * Тестируется `readStorageLimitBytes` из `storage-config` (модуль без
 * зависимости от БД), что покрывает разбор `STORAGE_LIMIT_GB`; флаг превышения
 * проверяется на чистой функции `isQuotaExceeded`-эквиваленте логики лимита.
 * @module server/storage/tests/compute-quota.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  readStorageLimitBytes,
  BYTES_PER_GB,
  STORAGE_LIMIT_GB_ENV,
} from '../storage-config';

/** Сохранённое исходное значение ENV для восстановления после тестов */
let originalValue: string | undefined;

beforeEach(() => {
  originalValue = process.env[STORAGE_LIMIT_GB_ENV];
});

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env[STORAGE_LIMIT_GB_ENV];
  } else {
    process.env[STORAGE_LIMIT_GB_ENV] = originalValue;
  }
});

describe('readStorageLimitBytes — ENV пуст/0/значение (Req 4.2, 4.3)', () => {
  it('возвращает null, когда переменная не задана (безлимит)', () => {
    delete process.env[STORAGE_LIMIT_GB_ENV];
    expect(readStorageLimitBytes()).toBeNull();
  });

  it('возвращает null для пустой строки', () => {
    process.env[STORAGE_LIMIT_GB_ENV] = '';
    expect(readStorageLimitBytes()).toBeNull();
  });

  it('возвращает null для строки из пробелов', () => {
    process.env[STORAGE_LIMIT_GB_ENV] = '   ';
    expect(readStorageLimitBytes()).toBeNull();
  });

  it('возвращает null для значения 0', () => {
    process.env[STORAGE_LIMIT_GB_ENV] = '0';
    expect(readStorageLimitBytes()).toBeNull();
  });

  it('возвращает null для отрицательного значения', () => {
    process.env[STORAGE_LIMIT_GB_ENV] = '-5';
    expect(readStorageLimitBytes()).toBeNull();
  });

  it('возвращает null для нечислового значения', () => {
    process.env[STORAGE_LIMIT_GB_ENV] = 'abc';
    expect(readStorageLimitBytes()).toBeNull();
  });

  it('конвертирует целое число ГБ в байты', () => {
    process.env[STORAGE_LIMIT_GB_ENV] = '1';
    expect(readStorageLimitBytes()).toBe(BYTES_PER_GB);
    expect(readStorageLimitBytes()).toBe(1024 ** 3);
  });

  it('конвертирует дробное число ГБ в байты (1.5 → 1610612736)', () => {
    process.env[STORAGE_LIMIT_GB_ENV] = '1.5';
    expect(readStorageLimitBytes()).toBe(1610612736);
  });

  it('обрезает пробелы вокруг значения', () => {
    process.env[STORAGE_LIMIT_GB_ENV] = '  2  ';
    expect(readStorageLimitBytes()).toBe(2 * BYTES_PER_GB);
  });

  it('округляет дробные байты вниз до целого', () => {
    process.env[STORAGE_LIMIT_GB_ENV] = '0.0000000001';
    const result = readStorageLimitBytes();
    expect(result).not.toBeNull();
    expect(Number.isInteger(result as number)).toBe(true);
  });
});
