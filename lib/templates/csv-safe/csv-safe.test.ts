/**
 * @fileoverview Тесты для шаблона csv-safe
 * @module templates/csv-safe/csv-safe.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateCsvSafe, generateSafeCsvWrite, generateSafeCsvRead } from './csv-safe.renderer';
import {
  validParamsWrite,
  validParamsRead,
  validParamsWithIndent,
} from './csv-safe.fixture';
import { csvSafeParamsSchema } from './csv-safe.schema';

describe('generateCsvSafe()', () => {
  it('генерирует запись в CSV', () => {
    const result = generateCsvSafe(validParamsWrite);
    assert.ok(result.includes("open(csv_file_path, 'a'"));
    assert.ok(result.includes('user_id'));
  });

  it('генерирует чтение из CSV', () => {
    const result = generateCsvSafe(validParamsRead);
    assert.ok(result.includes("open(csv_file_path, 'r'"));
    assert.ok(result.includes('csv_data'));
  });

  it('генерирует try/except для записи', () => {
    const result = generateCsvSafe(validParamsWrite);
    assert.ok(result.includes('try:'));
    assert.ok(result.includes('except Exception as e:'));
  });

  it('генерирует проверку os.path.exists', () => {
    const result = generateCsvSafe(validParamsWrite);
    assert.ok(result.includes('os.path.exists'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateCsvSafe(validParamsWithIndent);
    assert.ok(result.includes('    try:'));
  });
});

describe('generateSafeCsvWrite()', () => {
  it('генерирует запись через хелпер', () => {
    const result = generateSafeCsvWrite('my_file', 'my_data');
    assert.ok(result.includes("open(my_file, 'a'"));
    assert.ok(result.includes('my_data'));
  });
});

describe('generateSafeCsvRead()', () => {
  it('генерирует чтение через хелпер', () => {
    const result = generateSafeCsvRead('my_file', 'result_var');
    assert.ok(result.includes("open(my_file, 'r'"));
    assert.ok(result.includes('result_var'));
  });
});

describe('csvSafeParamsSchema', () => {
  it('принимает валидные параметры write', () => {
    assert.ok(csvSafeParamsSchema.safeParse(validParamsWrite).success);
  });

  it('принимает валидные параметры read', () => {
    assert.ok(csvSafeParamsSchema.safeParse(validParamsRead).success);
  });

  it('отклоняет неверную операцию', () => {
    assert.ok(!csvSafeParamsSchema.safeParse({ operation: 'delete', csvFileVar: 'f' }).success);
  });
});

describe('Производительность', () => {
  it('generateCsvSafe: быстрее 10ms', () => {
    const start = Date.now();
    generateCsvSafe(validParamsWrite);
    assert.ok(Date.now() - start < 10);
  });
});
