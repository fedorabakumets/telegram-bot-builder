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
import { bindPsqlQuery } from './psql-query-bind';

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

// ─── Параметры asyncpg вместо вклейки текста ────────────────────────────────

/**
 * Генерирует обработчик одного узла psql_query
 * @param data - Поля узла поверх значений по умолчанию
 * @returns Сгенерированный Python-код
 */
function renderQuery(data: Record<string, unknown> = {}): string {
  return generatePsqlQueryHandlers([
    makeNode('pq_bind', 'psql_query', {
      query: 'SELECT 1',
      saveResultTo: '',
      resultFormat: 'first_row',
      textTemplate: '',
      autoTransitionTo: '',
      connectionSource: 'builtin',
      ...data,
    }),
  ]);
}

describe('bindPsqlQuery()', () => {
  it('снимает кавычки вокруг скобок и нумерует с первого вхождения', () => {
    const bound = bindPsqlQuery("SELECT * FROM orders WHERE name = '{name}' AND id = {id}");
    expect(bound.sql).toBe('SELECT * FROM orders WHERE name = $1 AND id = $2');
    expect(bound.names).toEqual(['name', 'id']);
  });

  it('повторяет номер для того же имени', () => {
    const bound = bindPsqlQuery('SELECT {name}, {id}, {name}');
    expect(bound.sql).toBe('SELECT $1, $2, $1');
    expect(bound.names).toEqual(['name', 'id']);
  });

  it('оставляет запрос без скобок без параметров', () => {
    expect(bindPsqlQuery('SELECT 1')).toEqual({ sql: 'SELECT 1', names: [] });
  });

  it('понимает точку и индекс, не трогает двойные кавычки и пробел внутри кавычек', () => {
    expect(bindPsqlQuery('SELECT {a.b}, {a.b[0]}').names).toEqual(['a.b', 'a.b[0]']);
    expect(bindPsqlQuery('WHERE "{col}" = {val}').sql).toBe('WHERE "$1" = $2');
    expect(bindPsqlQuery("SELECT '{ name }'").sql).toBe("SELECT '{ name }'");
    expect(bindPsqlQuery("SELECT '{name} '").sql).toBe("SELECT '$1 '");
  });

  it('не раскрывает each и inline-выражение, LIKE с процентами оставляет $n внутри строки', () => {
    expect(bindPsqlQuery("WHERE name LIKE '%{q}%'").sql).toBe("WHERE name LIKE '%$1%'");
    expect(bindPsqlQuery('SELECT {#each items}{/each}').sql).toBe('SELECT {#each items}{/each}');
    expect(bindPsqlQuery('SELECT {=1+2}').sql).toBe('SELECT {=1+2}');
  });
});

describe('параметры SQL в сгенерированном коде', () => {
  const quoted = "SELECT * FROM orders WHERE name = '{name}' AND id = {id}";

  it('кладёт $1 и $2 в строку запроса и передаёт *_args', () => {
    const code = renderQuery({ query: quoted });
    expect(code).toContain('_query = "SELECT * FROM orders WHERE name = $1 AND id = $2"');
    expect(code).toContain('_psql_param("name", _all_vars)');
    expect(code).toContain('_psql_param("id", _all_vars)');
    expect(code).toContain('_conn.fetchrow(_query, *_args)');
    expect(code).not.toContain("{name}");
    expect(code).not.toContain('{id}');
  });

  it('запрос без скобок вызывается без аргументов', () => {
    const code = renderQuery({ query: 'SELECT 1', resultFormat: 'json' });
    expect(code).toContain('_query = "SELECT 1"');
    expect(code).toContain('_conn.fetch(_query)');
    expect(code).not.toContain('*_args');
    expect(code).not.toContain('_args');
  });

  it('одинаковое имя — один вызов _psql_param', () => {
    const code = renderQuery({ query: 'SELECT {name} WHERE a = {name}' });
    expect(code).toContain('_query = "SELECT $1 WHERE a = $1"');
    expect(code.match(/_psql_param\("name"/g)).toHaveLength(1);
    expect(code).not.toContain('$2');
  });

  it('ставит statement_timeout и для builtin, и для env', () => {
    for (const data of [
      { connectionSource: 'builtin' },
      { connectionSource: 'env', connectionEnvVar: 'MY_DB' },
      { connectionSource: 'custom', connectionString: 'postgresql://u:p@h:5432/db' },
    ]) {
      const code = renderQuery(data);
      expect(code).toContain('async with _conn.transaction():');
      expect(code).toContain('SET LOCAL statement_timeout = \'15s\'');
    }
  });

  it('не пишет аргументы и текст запроса в лог', () => {
    const code = renderQuery({ query: quoted });
    const logs = code.split('\n').filter(line => line.includes('logging.'));
    expect(logs.length).toBeGreaterThan(0);
    for (const line of logs) {
      expect(line).not.toContain('_args');
      expect(line).not.toContain('SELECT * FROM orders');
    }
  });

  it('шаблон resultFormat text по-прежнему собирается через replace_variables_in_text', () => {
    const code = renderQuery({
      query: 'SELECT name, score FROM leaderboard',
      resultFormat: 'text',
      saveResultTo: 'board',
      textTemplate: '{name} — {score}',
    });
    expect(code).toContain('replace_variables_in_text("{name} — {score}"');
    expect(code).toContain('_conn.fetch(_query)');
    expect(code).not.toContain('*_args');
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
