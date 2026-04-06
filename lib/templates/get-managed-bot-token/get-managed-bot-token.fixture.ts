/**
 * @fileoverview Тестовые данные для шаблона обработчиков узла получения токена управляемого бота
 * @module templates/get-managed-bot-token/get-managed-bot-token.fixture
 */

import type { GetManagedBotTokenTemplateParams } from './get-managed-bot-token.params';
import type { Node } from '@shared/schema';

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

// ─── Низкоуровневые фикстуры (GetManagedBotTokenTemplateParams) ───────────────

/** Пустой массив записей */
export const validParamsEmpty: GetManagedBotTokenTemplateParams = {
  entries: [],
};

/** Одна запись узла получения токена */
export const validParamsSingle: GetManagedBotTokenTemplateParams = {
  entries: [
    {
      nodeId: 'get_token_1',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
      botIdSource: 'variable',
      botIdVariable: 'bot_id',
      saveTokenTo: 'bot_token',
    },
  ],
};

/** Несколько записей узлов получения токена */
export const validParamsMultiple: GetManagedBotTokenTemplateParams = {
  entries: [
    {
      nodeId: 'get_token_1',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
      botIdSource: 'variable',
      botIdVariable: 'bot_id',
      saveTokenTo: 'bot_token',
    },
    {
      nodeId: 'get_token_2',
      targetNodeId: 'msg_2',
      targetNodeType: 'message',
      botIdSource: 'manual',
      botIdManual: '987654321',
      saveTokenTo: 'token_2',
      saveErrorTo: 'error_2',
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) ────────────────────────────────────────

/** Один узел get_managed_bot_token с основными полями */
export const nodesWithTrigger: Node[] = [
  makeNode('get_token_1', 'get_managed_bot_token', {
    autoTransitionTo: 'msg_1',
    botIdSource: 'variable',
    botIdVariable: 'bot_id',
    saveTokenTo: 'bot_token',
  }),
  makeNode('msg_1', 'message', { messageText: 'Токен получен' }),
];

/** get_managed_bot_token без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('get_token_bad', 'get_managed_bot_token', { autoTransitionTo: '' }),
];

/** Узлы без get_managed_bot_token — должны быть пропущены */
export const nodesWithoutTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('get_token_1', 'get_managed_bot_token', {
    autoTransitionTo: 'msg_1',
    botIdVariable: 'bot_id',
    saveTokenTo: 'bot_token',
  }),
  makeNode('msg_1', 'message', {}),
];

/** Узел с ручным указанием bot_id */
export const nodesWithManualId: Node[] = [
  makeNode('get_token_manual', 'get_managed_bot_token', {
    autoTransitionTo: 'msg_1',
    botIdSource: 'manual',
    botIdManual: '123456789',
    saveTokenTo: 'bot_token',
    saveErrorTo: 'token_error',
  }),
  makeNode('msg_1', 'message', { messageText: 'Токен получен вручную' }),
];
