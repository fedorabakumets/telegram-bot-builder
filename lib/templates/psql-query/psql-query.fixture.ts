/**
 * @fileoverview Тестовые данные для шаблона узла psql_query
 * @module templates/psql-query/psql-query.fixture
 */

import type { PsqlQueryTemplateParams } from './psql-query.params';
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

// ─── Низкоуровневые фикстуры (PsqlQueryTemplateParams) ───────────────────────

/** Узел без saveResultTo и autoTransitionTo */
export const validParamsEmpty: PsqlQueryTemplateParams = {
  nodeId: 'node_1',
  query: 'SELECT 1',
  saveResultTo: '',
  resultFormat: 'first_row',
  textTemplate: '',
  autoTransitionTo: '',
};

/** SELECT с first_row форматом */
export const validParamsSingle: PsqlQueryTemplateParams = {
  nodeId: 'node_2',
  query: 'SELECT * FROM users WHERE id = {user_id}',
  saveResultTo: 'user_row',
  resultFormat: 'first_row',
  textTemplate: '',
  autoTransitionTo: '',
};

/** SELECT с text форматом и textTemplate */
export const validParamsText: PsqlQueryTemplateParams = {
  nodeId: 'node_3',
  query: 'SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT 10',
  saveResultTo: 'leaderboard_text',
  resultFormat: 'text',
  textTemplate: '{name} — {score}',
  autoTransitionTo: 'node_next',
};

/** UPDATE с affected форматом */
export const validParamsAffected: PsqlQueryTemplateParams = {
  nodeId: 'node_4',
  query: 'UPDATE users SET score = score + 1 WHERE id = {user_id}',
  saveResultTo: 'affected_rows',
  resultFormat: 'affected',
  textTemplate: '',
  autoTransitionTo: '',
};

// ─── Высокоуровневые фикстуры (Node[]) для collectPsqlQueryEntries ────────────

/** Массив узлов с psql_query */
export const nodesWithPsqlQuery: Node[] = [
  makeNode('pq_1', 'psql_query', {
    query: 'SELECT * FROM users WHERE id = {user_id}',
    saveResultTo: 'user_row',
    resultFormat: 'first_row',
    textTemplate: '',
    autoTransitionTo: 'msg_1',
  }),
  makeNode('msg_1', 'message', { messageText: 'Готово!' }),
];

/** Массив без psql_query */
export const nodesWithoutPsqlQuery: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узел + psql_query + message */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('pq_1', 'psql_query', {
    query: 'SELECT 1',
    saveResultTo: '',
    resultFormat: 'first_row',
    textTemplate: '',
    autoTransitionTo: '',
  }),
  makeNode('msg_1', 'message', {}),
];
