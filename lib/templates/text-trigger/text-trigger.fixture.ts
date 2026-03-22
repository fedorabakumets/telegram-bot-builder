/**
 * @fileoverview Тестовые данные для шаблона обработчиков текстовых триггеров
 * @module templates/text-trigger/text-trigger.fixture
 */

import type { TextTriggerTemplateParams } from './text-trigger.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (TextTriggerTemplateParams) ─────────────────────

/** Пустой массив триггеров */
export const validParamsEmpty: TextTriggerTemplateParams = {
  entries: [],
};

/** Один триггер с exact совпадением */
export const validParamsExact: TextTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_1',
      synonyms: ['привет'],
      matchType: 'exact',
      targetNodeId: 'msg_hello',
      targetNodeType: 'message',
    },
  ],
};

/** Один триггер с contains совпадением */
export const validParamsContains: TextTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_2',
      synonyms: ['помощь'],
      matchType: 'contains',
      targetNodeId: 'msg_help',
      targetNodeType: 'message',
    },
  ],
};

/** Триггер с несколькими синонимами */
export const validParamsMultipleSynonyms: TextTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_3',
      synonyms: ['привет', 'здравствуй', 'hello'],
      matchType: 'exact',
      targetNodeId: 'msg_greeting',
      targetNodeType: 'message',
    },
  ],
};

/** Несколько триггеров разных типов */
export const validParamsMixed: TextTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_exact',
      synonyms: ['старт'],
      matchType: 'exact',
      targetNodeId: 'msg_start',
      targetNodeType: 'message',
    },
    {
      nodeId: 'trigger_contains',
      synonyms: ['помоги'],
      matchType: 'contains',
      targetNodeId: 'msg_help',
      targetNodeType: 'message',
    },
  ],
};

/** Триггер с isPrivateOnly */
export const validParamsPrivateOnly: TextTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_private',
      synonyms: ['секрет'],
      matchType: 'exact',
      targetNodeId: 'msg_secret',
      targetNodeType: 'message',
      isPrivateOnly: true,
    },
  ],
};

/** Невалидные параметры — неверный matchType */
export const invalidParamsWrongMatchType = {
  entries: [
    {
      nodeId: 'trigger_bad',
      synonyms: ['тест'],
      matchType: 'fuzzy',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) для collectTextTriggerEntries ──────────

/** Один text_trigger узел с exact совпадением */
export const nodesWithExactTrigger: Node[] = [
  makeNode('trigger_1', 'text_trigger', {
    textSynonyms: ['привет'],
    textMatchType: 'exact',
    autoTransitionTo: 'msg_hello',
  }),
  makeNode('msg_hello', 'message', { messageText: 'Привет!' }),
];

/** Один text_trigger узел с contains совпадением */
export const nodesWithContainsTrigger: Node[] = [
  makeNode('trigger_2', 'text_trigger', {
    textSynonyms: ['помощь'],
    textMatchType: 'contains',
    autoTransitionTo: 'msg_help',
  }),
  makeNode('msg_help', 'message', { messageText: 'Чем помочь?' }),
];

/** text_trigger с несколькими синонимами */
export const nodesWithMultipleSynonyms: Node[] = [
  makeNode('trigger_3', 'text_trigger', {
    textSynonyms: ['привет', 'здравствуй', 'hello'],
    textMatchType: 'exact',
    autoTransitionTo: 'msg_greeting',
  }),
  makeNode('msg_greeting', 'message', {}),
];

/** text_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('trigger_bad', 'text_trigger', {
    textSynonyms: ['тест'],
    textMatchType: 'exact',
    autoTransitionTo: '',
  }),
];

/** text_trigger с пустым textSynonyms — должен быть пропущен */
export const nodesWithEmptySynonyms: Node[] = [
  makeNode('trigger_empty', 'text_trigger', {
    textSynonyms: [],
    textMatchType: 'exact',
    autoTransitionTo: 'msg_1',
  }),
];

/** Узлы без text_trigger — должны быть пропущены */
export const nodesWithoutTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('trigger_1', 'text_trigger', {
    textSynonyms: ['привет'],
    textMatchType: 'exact',
    autoTransitionTo: 'msg_1',
  }),
  makeNode('msg_1', 'message', {}),
];
