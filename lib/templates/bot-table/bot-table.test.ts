/**
 * @fileoverview Тесты для шаблона узла bot_table
 * @module templates/bot-table/bot-table.test
 */

import { describe, it, expect } from 'vitest';
import {
  collectBotTableEntries,
  generateBotTableHandlers,
} from './bot-table.renderer';
import {
  validParamsRead,
  validParamsInsert,
  validParamsUpdate,
  validParamsUpsert,
  validParamsDelete,
  nodesWithBotTable,
  nodesWithMissingTableName,
  nodesWithoutBotTable,
  nodesWithNullAndMixed,
  nodesWithMultipleBotTables,
} from './bot-table.fixture';
import { botTableEntrySchema } from './bot-table.schema';

// ─── generateBotTableHandlers() ──────────────────────────────────────────────

describe('generateBotTableHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateBotTableHandlers([])).toBe('');
  });

  it('узлы без bot_table → пустая строка', () => {
    expect(generateBotTableHandlers(nodesWithoutBotTable)).toBe('');
  });

  it('генерирует async def handle_callback_', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('async def handle_callback_');
  });

  it('содержит db_pool', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('db_pool');
  });

  it('содержит replace_variables_in_text', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('replace_variables_in_text');
  });

  it('содержит init_all_user_vars', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('init_all_user_vars');
  });

  it('содержит logging.info', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('logging.info');
  });

  it('содержит logging.error', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('logging.error');
  });

  it('узел без tableName не генерирует код', () => {
    const r = generateBotTableHandlers(nodesWithMissingTableName);
    expect(r).toBe('');
  });

  it('генерирует несколько обработчиков для нескольких узлов', () => {
    const r = generateBotTableHandlers(nodesWithMultipleBotTables);
    expect(r).toContain('handle_callback_tbl_read');
    expect(r).toContain('handle_callback_tbl_update');
  });
});

// ─── botTableEntrySchema ─────────────────────────────────────────────────────

describe('botTableEntrySchema', () => {
  it('принимает валидные параметры read', () => {
    expect(botTableEntrySchema.safeParse(validParamsRead).success).toBe(true);
  });

  it('принимает валидные параметры insert', () => {
    expect(botTableEntrySchema.safeParse(validParamsInsert).success).toBe(true);
  });

  it('принимает валидные параметры update', () => {
    expect(botTableEntrySchema.safeParse(validParamsUpdate).success).toBe(true);
  });

  it('принимает валидные параметры upsert', () => {
    expect(botTableEntrySchema.safeParse(validParamsUpsert).success).toBe(true);
  });

  it('принимает валидные параметры delete', () => {
    expect(botTableEntrySchema.safeParse(validParamsDelete).success).toBe(true);
  });

  it('отклоняет отсутствие nodeId', () => {
    const invalid = { tableName: 'test', operation: 'read' };
    expect(botTableEntrySchema.safeParse(invalid).success).toBe(false);
  });

  it('отклоняет отсутствие tableName', () => {
    const invalid = { nodeId: 'x', operation: 'read' };
    expect(botTableEntrySchema.safeParse(invalid).success).toBe(false);
  });

  it('применяет значения по умолчанию', () => {
    const minimal = { nodeId: 'x', tableName: 'test', operation: 'read' };
    const result = botTableEntrySchema.parse(minimal);
    expect(result.where).toEqual([]);
    expect(result.updates).toEqual([]);
    expect(result.row).toEqual({});
    expect(result.autoTransitionTo).toBe('');
  });
});

// ─── collectBotTableEntries() ────────────────────────────────────────────────

describe('collectBotTableEntries()', () => {
  it('собирает узел с правильными полями', () => {
    const entries = collectBotTableEntries(nodesWithBotTable);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('tbl_1');
    expect(entries[0].tableName).toBe('profiles');
    expect(entries[0].operation).toBe('read');
    expect(entries[0].autoTransitionTo).toBe('msg_1');
  });

  it('пропускает null-узлы', () => {
    const entries = collectBotTableEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('tbl_1');
  });

  it('пропускает узлы не типа bot_table', () => {
    expect(collectBotTableEntries(nodesWithoutBotTable)).toHaveLength(0);
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectBotTableEntries([])).toEqual([]);
  });

  it('where по умолчанию пустой массив', () => {
    const entries = collectBotTableEntries(nodesWithMissingTableName);
    expect(entries[0].where).toEqual([]);
  });

  it('собирает несколько узлов bot_table', () => {
    const entries = collectBotTableEntries(nodesWithMultipleBotTables);
    expect(entries).toHaveLength(2);
    expect(entries[0].operation).toBe('read');
    expect(entries[1].operation).toBe('update');
  });
});

// ─── Операция read ───────────────────────────────────────────────────────────

describe('Операция read', () => {
  it('содержит SELECT FROM bot_tables', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('bot_tables');
  });

  it('содержит bot_table_rows', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('bot_table_rows');
  });

  it('содержит bot_table_columns', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('bot_table_columns');
  });

  it('содержит saveResultTo в user_data', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('user_data[user_id]');
    expect(r).toContain('profile');
  });
});

// ─── Операция update (атомарные операции) ────────────────────────────────────

describe('Операция update', () => {
  it('содержит атомарный increment через SQL', () => {
    const r = generateBotTableHandlers(nodesWithMultipleBotTables);
    expect(r).toContain('COALESCE');
    expect(r).toContain('jsonb_build_object');
  });

  it('содержит инвалидацию кеша', () => {
    const r = generateBotTableHandlers(nodesWithMultipleBotTables);
    expect(r).toContain('_bot_tables_cache = None');
  });
});

// ─── Автопереход ─────────────────────────────────────────────────────────────

describe('Автопереход', () => {
  it('содержит FakeCallback при наличии autoTransitionTo', () => {
    const r = generateBotTableHandlers(nodesWithBotTable);
    expect(r).toContain('FakeCallback');
    expect(r).toContain('handle_callback_msg_1');
  });

  it('не содержит FakeCallback без autoTransitionTo', () => {
    const nodes = [
      { id: 'tbl_x', type: 'bot_table', data: {
        tableName: 'test', operation: 'delete',
        where: [{ column: 'id', value: '1' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateBotTableHandlers(nodes);
    expect(r).not.toContain('FakeCallback');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateBotTableHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateBotTableHandlers(nodesWithBotTable);
    expect(Date.now() - start).toBeLessThan(100);
  });
});
