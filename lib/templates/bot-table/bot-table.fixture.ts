/**
 * @fileoverview Тестовые данные для шаблона узла bot_table
 * @module templates/bot-table/bot-table.fixture
 */

import type { BotTableEntry } from './bot-table.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

/**
 * Создаёт минимальный узел для тестов
 * @param id - ID узла
 * @param type - Тип узла
 * @param data - Данные узла
 * @returns Объект узла
 */
export function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (BotTableEntry) ─────────────────────────────────

/** Узел read с одним условием WHERE */
export const validParamsRead: BotTableEntry = {
  nodeId: 'tbl_read_1',
  tableName: 'profiles',
  operation: 'read',
  where: [{ column: 'telegram_id', value: '{user_id}' }],
  updates: [],
  row: {},
  key: '',
  onConflict: 'ignore',
  saveResultTo: 'profile',
  resultFormat: 'first_row',
  returnColumns: [],
  orderBy: '',
  orderDirection: 'desc',
  limit: 0,
  autoTransitionTo: 'msg_1',
};

/** Узел insert с данными строки */
export const validParamsInsert: BotTableEntry = {
  nodeId: 'tbl_insert_1',
  tableName: 'profiles',
  operation: 'insert',
  where: [],
  updates: [],
  row: { telegram_id: '{user_id}', balance: '100', reputation: '100' },
  key: '',
  onConflict: 'ignore',
  saveResultTo: '',
  resultFormat: 'first_row',
  returnColumns: [],
  orderBy: '',
  orderDirection: 'desc',
  limit: 0,
  autoTransitionTo: 'msg_welcome',
};

/** Узел update с increment */
export const validParamsUpdate: BotTableEntry = {
  nodeId: 'tbl_update_1',
  tableName: 'profiles',
  operation: 'update',
  where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }],
  updates: [
    { column: 'reputation', op: 'increment', value: '10' },
    { column: 'last_rep_at', op: 'set', value: '{__now__}' },
  ],
  row: {},
  key: '',
  onConflict: 'ignore',
  saveResultTo: 'updated',
  resultFormat: 'first_row',
  returnColumns: ['reputation'],
  orderBy: '',
  orderDirection: 'desc',
  limit: 0,
  autoTransitionTo: 'msg_rep_done',
};

/** Узел upsert */
export const validParamsUpsert: BotTableEntry = {
  nodeId: 'tbl_upsert_1',
  tableName: 'profiles',
  operation: 'upsert',
  where: [],
  updates: [],
  row: { telegram_id: '{user_id}', balance: '100', reputation: '100', bio: '' },
  key: 'telegram_id',
  onConflict: 'ignore',
  saveResultTo: 'profile',
  resultFormat: 'first_row',
  returnColumns: [],
  orderBy: '',
  orderDirection: 'desc',
  limit: 0,
  autoTransitionTo: 'msg_next',
};

/** Узел delete */
export const validParamsDelete: BotTableEntry = {
  nodeId: 'tbl_delete_1',
  tableName: 'relationships',
  operation: 'delete',
  where: [
    { column: 'user_a', value: '{user_id}' },
    { column: 'user_b', value: '{target_user_id}' },
  ],
  updates: [],
  row: {},
  key: '',
  onConflict: 'ignore',
  saveResultTo: '',
  resultFormat: 'first_row',
  returnColumns: [],
  orderBy: '',
  orderDirection: 'desc',
  limit: 0,
  autoTransitionTo: '',
};

// ─── Высокоуровневые фикстуры (Node[]) для collectBotTableEntries ─────────────

/** Один узел bot_table (read) + message */
export const nodesWithBotTable: Node[] = [
  makeNode('tbl_1', 'bot_table', {
    tableName: 'profiles',
    operation: 'read',
    where: [{ column: 'telegram_id', value: '{user_id}' }],
    saveResultTo: 'profile',
    resultFormat: 'first_row',
    autoTransitionTo: 'msg_1',
  }),
  makeNode('msg_1', 'message', { messageText: 'Профиль загружен' }),
];

/** Узел bot_table без tableName */
export const nodesWithMissingTableName: Node[] = [
  makeNode('tbl_bad', 'bot_table', { operation: 'read' }),
];

/** Только start + message — нет bot_table */
export const nodesWithoutBotTable: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узел + bot_table + message */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('tbl_1', 'bot_table', {
    tableName: 'profiles',
    operation: 'insert',
    row: { telegram_id: '{user_id}', balance: '50' },
    autoTransitionTo: '',
  }),
  makeNode('msg_1', 'message', {}),
];

/** Несколько узлов bot_table разных операций */
export const nodesWithMultipleBotTables: Node[] = [
  makeNode('tbl_read', 'bot_table', {
    tableName: 'profiles',
    operation: 'read',
    where: [{ column: 'telegram_id', value: '{user_id}' }],
    saveResultTo: 'me',
    resultFormat: 'first_row',
    autoTransitionTo: 'tbl_update',
  }),
  makeNode('tbl_update', 'bot_table', {
    tableName: 'profiles',
    operation: 'update',
    where: [{ column: 'telegram_id', value: '{user_id}' }],
    updates: [{ column: 'balance', op: 'decrement', value: '50' }],
    autoTransitionTo: 'msg_done',
  }),
  makeNode('msg_done', 'message', { messageText: 'Готово' }),
];
