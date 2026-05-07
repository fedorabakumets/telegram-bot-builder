/**
 * @fileoverview Тесты для шаблона узла psql_query
 * @module templates/psql-query/psql-query.test
 */

import { describe, it, expect } from 'vitest';
import {
  collectPsqlQueryEntries,
  generatePsqlQueryHandlers,
} from './psql-query.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsText,
  validParamsAffected,
  nodesWithPsqlQuery,
  nodesWithoutPsqlQuery,
  nodesWithNullAndMixed,
  makeNode,
} from './psql-query.fixture';
import { psqlQueryParamsSchema } from './psql-query.schema';

// ─── generatePsqlQueryHandlers() ─────────────────────────────────────────────

describe('generatePsqlQueryHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generatePsqlQueryHandlers([])).toBe('');
  });

  it('узлы без psql_query → пустая строка', () => {
    expect(generatePsqlQueryHandlers(nodesWithoutPsqlQuery)).toBe('');
  });

  it('генерирует async def handle_callback_', () => {
    const r = generatePsqlQueryHandlers(nodesWithPsqlQuery);
    expect(r).toContain('async def handle_callback_');
  });

  it('содержит @dp.callback_query', () => {
    const r = generatePsqlQueryHandlers(nodesWithPsqlQuery);
    expect(r).toContain('@dp.callback_query');
  });

  it('содержит db_pool is None', () => {
    const r = generatePsqlQueryHandlers(nodesWithPsqlQuery);
    expect(r).toContain('db_pool is None');
  });

  it('содержит replace_variables_in_text', () => {
    const r = generatePsqlQueryHandlers(nodesWithPsqlQuery);
    expect(r).toContain('replace_variables_in_text');
  });

  it('содержит logging.info', () => {
    const r = generatePsqlQueryHandlers(nodesWithPsqlQuery);
    expect(r).toContain('logging.info');
  });

  it('содержит logging.error', () => {
    const r = generatePsqlQueryHandlers(nodesWithPsqlQuery);
    expect(r).toContain('logging.error');
  });
});

// ─── psqlQueryParamsSchema ────────────────────────────────────────────────────

describe('psqlQueryParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(psqlQueryParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('отклоняет отсутствие nodeId', () => {
    const invalid = { query: 'SELECT 1', saveResultTo: '', resultFormat: 'first_row', textTemplate: '', autoTransitionTo: '' };
    expect(psqlQueryParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('принимает все форматы результата', () => {
    for (const fmt of ['json', 'text', 'first_row', 'affected'] as const) {
      expect(psqlQueryParamsSchema.safeParse({ ...validParamsEmpty, resultFormat: fmt }).success).toBe(true);
    }
  });

  it('отклоняет неизвестный формат', () => {
    expect(psqlQueryParamsSchema.safeParse({ ...validParamsEmpty, resultFormat: 'unknown' }).success).toBe(false);
  });
});

// ─── collectPsqlQueryEntries() ────────────────────────────────────────────────

describe('collectPsqlQueryEntries()', () => {
  it('собирает узел с правильными полями', () => {
    const entries = collectPsqlQueryEntries(nodesWithPsqlQuery);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('pq_1');
    expect(entries[0].saveResultTo).toBe('user_row');
    expect(entries[0].autoTransitionTo).toBe('msg_1');
  });

  it('пропускает null-узлы', () => {
    const entries = collectPsqlQueryEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('pq_1');
  });

  it('пропускает узлы не типа psql_query', () => {
    expect(collectPsqlQueryEntries(nodesWithoutPsqlQuery)).toHaveLength(0);
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectPsqlQueryEntries([])).toEqual([]);
  });

  it('использует дефолты для отсутствующих полей', () => {
    const nodes = [makeNode('pq_bare', 'psql_query', {})];
    const entries = collectPsqlQueryEntries(nodes);
    expect(entries[0].query).toBe('');
    expect(entries[0].saveResultTo).toBe('');
    expect(entries[0].resultFormat).toBe('first_row');
    expect(entries[0].textTemplate).toBe('');
    expect(entries[0].autoTransitionTo).toBe('');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generatePsqlQueryHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generatePsqlQueryHandlers(nodesWithPsqlQuery);
    expect(Date.now() - start).toBeLessThan(100);
  });
});
