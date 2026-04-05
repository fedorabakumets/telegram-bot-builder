/**
 * @fileoverview Тестовые данные для шаблона обработчиков триггеров обновления управляемого бота
 * @module templates/managed-bot-updated-trigger/managed-bot-updated-trigger.fixture
 */

import type { ManagedBotUpdatedTriggerTemplateParams } from './managed-bot-updated-trigger.params';
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

// ─── Низкоуровневые фикстуры (ManagedBotUpdatedTriggerTemplateParams) ─────────

/** Пустой массив триггеров */
export const validParamsEmpty: ManagedBotUpdatedTriggerTemplateParams = {
  entries: [],
};

/** Один триггер обновления управляемого бота */
export const validParamsSingle: ManagedBotUpdatedTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'mbu_trigger_1',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
      saveBotIdTo: 'bot_id',
      saveBotUsernameTo: 'bot_username',
      saveBotNameTo: 'bot_name',
      saveCreatorIdTo: 'creator_id',
      saveCreatorUsernameTo: 'creator_username',
    },
  ],
};

/** Несколько триггеров обновления управляемого бота */
export const validParamsMultiple: ManagedBotUpdatedTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'mbu_trigger_1',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
      saveBotIdTo: 'bot_id',
      saveCreatorIdTo: 'creator_id',
    },
    {
      nodeId: 'mbu_trigger_2',
      targetNodeId: 'msg_2',
      targetNodeType: 'message',
      saveBotUsernameTo: 'bot_username',
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) ────────────────────────────────────────

/** Один managed_bot_updated_trigger узел с основными полями */
export const nodesWithTrigger: Node[] = [
  makeNode('mbu_trigger_1', 'managed_bot_updated_trigger', {
    autoTransitionTo: 'msg_1',
    saveBotIdTo: 'bot_id',
    saveBotUsernameTo: 'bot_username',
    saveCreatorIdTo: 'creator_id',
  }),
  makeNode('msg_1', 'message', { messageText: 'Бот создан' }),
];

/** managed_bot_updated_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('mbu_bad', 'managed_bot_updated_trigger', { autoTransitionTo: '' }),
];

/** Узлы без managed_bot_updated_trigger — должны быть пропущены */
export const nodesWithoutTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('mbu_trigger_1', 'managed_bot_updated_trigger', {
    autoTransitionTo: 'msg_1',
    saveBotIdTo: 'bot_id',
  }),
  makeNode('msg_1', 'message', {}),
];

/** Триггер с фильтром по user_id */
export const nodesWithFilter: Node[] = [
  makeNode('mbu_filter_1', 'managed_bot_updated_trigger', {
    autoTransitionTo: 'msg_1',
    filterByUserId: '123456789',
    saveBotIdTo: 'bot_id',
  }),
  makeNode('msg_1', 'message', { messageText: 'Только для владельца' }),
];
