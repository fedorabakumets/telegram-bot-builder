/**
 * @fileoverview Тесты для шаблона узла convert_file
 * @module templates/convert-file/convert-file.test
 */
import { describe, it, expect } from 'vitest';
import {
  collectConvertFileEntries,
  generateConvertFileHandlers,
} from './convert-file.renderer';
import {
  validParamsEmpty,
  validParamsCsv,
  validParamsJson,
  nodesWithConvertFile,
  nodesWithoutConvertFile,
  nodesWithNullAndMixed,
  makeNode,
} from './convert-file.fixture';
import { convertFileParamsSchema } from './convert-file.schema';

// ─── generateConvertFileHandlers() ───────────────────────────────────────────

describe('generateConvertFileHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateConvertFileHandlers([])).toBe('');
  });

  it('узлы без convert_file → пустая строка', () => {
    expect(generateConvertFileHandlers(nodesWithoutConvertFile)).toBe('');
  });

  it('генерирует async def handle_callback_', () => {
    const r = generateConvertFileHandlers(nodesWithConvertFile);
    expect(r).toContain('async def handle_callback_');
  });

  it('содержит @dp.callback_query', () => {
    const r = generateConvertFileHandlers(nodesWithConvertFile);
    expect(r).toContain('@dp.callback_query');
  });

  it('содержит import csv', () => {
    const r = generateConvertFileHandlers(nodesWithConvertFile);
    expect(r).toContain('import csv');
  });

  it('содержит import base64', () => {
    const r = generateConvertFileHandlers(nodesWithConvertFile);
    expect(r).toContain('import base64');
  });

  it('содержит logging.info', () => {
    const r = generateConvertFileHandlers(nodesWithConvertFile);
    expect(r).toContain('logging.info');
  });

  it('содержит logging.error', () => {
    const r = generateConvertFileHandlers(nodesWithConvertFile);
    expect(r).toContain('logging.error');
  });
});

// ─── convertFileParamsSchema ──────────────────────────────────────────────────

describe('convertFileParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(convertFileParamsSchema.safeParse(validParamsCsv).success).toBe(true);
  });

  it('отклоняет отсутствие nodeId', () => {
    const invalid = {
      inputVariable: 'data', format: 'csv', fileName: 'f.csv',
      csvDelimiter: ',', includeHeaderRow: true, outputVariable: '', autoTransitionTo: '',
    };
    expect(convertFileParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('принимает все форматы файла', () => {
    for (const fmt of ['csv', 'json'] as const) {
      expect(convertFileParamsSchema.safeParse({ ...validParamsEmpty, format: fmt }).success).toBe(true);
    }
  });

  it('отклоняет неизвестный формат', () => {
    expect(convertFileParamsSchema.safeParse({ ...validParamsEmpty, format: 'xlsx' }).success).toBe(false);
  });
});

// ─── collectConvertFileEntries() ─────────────────────────────────────────────

describe('collectConvertFileEntries()', () => {
  it('собирает узел с правильными полями', () => {
    const entries = collectConvertFileEntries(nodesWithConvertFile);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('cf_1');
    expect(entries[0].inputVariable).toBe('users_data');
    expect(entries[0].outputVariable).toBe('export_file');
    expect(entries[0].autoTransitionTo).toBe('msg_1');
  });

  it('пропускает null-узлы', () => {
    const entries = collectConvertFileEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('cf_1');
  });

  it('пропускает узлы не типа convert_file', () => {
    expect(collectConvertFileEntries(nodesWithoutConvertFile)).toHaveLength(0);
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectConvertFileEntries([])).toEqual([]);
  });

  it('использует дефолты для отсутствующих полей', () => {
    const nodes = [makeNode('cf_bare', 'convert_file', {})];
    const entries = collectConvertFileEntries(nodes);
    expect(entries[0].inputVariable).toBe('');
    expect(entries[0].format).toBe('csv');
    expect(entries[0].fileName).toBe('export_{date}.csv');
    expect(entries[0].csvDelimiter).toBe(',');
    expect(entries[0].includeHeaderRow).toBe(true);
    expect(entries[0].outputVariable).toBe('');
    expect(entries[0].autoTransitionTo).toBe('');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateConvertFileHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateConvertFileHandlers(nodesWithConvertFile);
    expect(Date.now() - start).toBeLessThan(100);
  });
});
