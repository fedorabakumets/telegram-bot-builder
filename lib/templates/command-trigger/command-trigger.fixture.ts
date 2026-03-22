/**
 * @fileoverview Тестовые данные для шаблона обработчиков командных триггеров
 * @module templates/command-trigger/command-trigger.fixture
 */

import type { CommandTriggerTemplateParams } from './command-trigger.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (CommandTriggerTemplateParams) ──────────────────

/** Пустой массив триггеров */
export const validParamsEmpty: CommandTriggerTemplateParams = {
  entries: [],
};

/** Один триггер /start */
export const validParamsSingle: CommandTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_start',
      command: '/start',
      description: 'Запустить бота',
      showInMenu: true,
      targetNodeId: 'msg_welcome',
      targetNodeType: 'message',
    },
  ],
};

/** Триггер с isPrivateOnly */
export const validParamsPrivateOnly: CommandTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_secret',
      command: '/secret',
      description: 'Секретная команда',
      isPrivateOnly: true,
      targetNodeId: 'msg_secret',
      targetNodeType: 'message',
    },
  ],
};

/** Несколько триггеров */
export const validParamsMultiple: CommandTriggerTemplateParams = {
  entries: [
    {
      nodeId: 'trigger_start',
      command: '/start',
      description: 'Запустить бота',
      showInMenu: true,
      targetNodeId: 'msg_welcome',
      targetNodeType: 'message',
    },
    {
      nodeId: 'trigger_help',
      command: '/help',
      description: 'Помощь',
      showInMenu: true,
      targetNodeId: 'msg_help',
      targetNodeType: 'message',
    },
    {
      nodeId: 'trigger_settings',
      command: '/settings',
      targetNodeId: 'msg_settings',
      targetNodeType: 'message',
    },
  ],
};

/** Невалидные параметры — пустая команда */
export const invalidParamsMissingCommand = {
  entries: [
    {
      nodeId: 'trigger_bad',
      command: '',
      targetNodeId: 'msg_1',
      targetNodeType: 'message',
    },
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) для collectCommandTriggerEntries ───────

/** Один command_trigger узел */
export const nodesWithCommandTrigger: Node[] = [
  makeNode('trigger_start', 'command_trigger', {
    command: '/start',
    description: 'Запустить бота',
    showInMenu: true,
    autoTransitionTo: 'msg_welcome',
  }),
  makeNode('msg_welcome', 'message', { messageText: 'Добро пожаловать!' }),
];

/** Несколько command_trigger узлов */
export const nodesWithMultipleCommandTriggers: Node[] = [
  makeNode('trigger_start', 'command_trigger', {
    command: '/start',
    description: 'Запустить бота',
    autoTransitionTo: 'msg_welcome',
  }),
  makeNode('trigger_help', 'command_trigger', {
    command: '/help',
    description: 'Помощь',
    autoTransitionTo: 'msg_help',
  }),
  makeNode('msg_welcome', 'message', {}),
  makeNode('msg_help', 'message', {}),
];

/** command_trigger без autoTransitionTo — должен быть пропущен */
export const nodesWithMissingTarget: Node[] = [
  makeNode('trigger_bad', 'command_trigger', {
    command: '/start',
    autoTransitionTo: '',
  }),
];

/** command_trigger с пустой командой — должен быть пропущен */
export const nodesWithEmptyCommand: Node[] = [
  makeNode('trigger_empty', 'command_trigger', {
    command: '',
    autoTransitionTo: 'msg_1',
  }),
];

/** Узлы без command_trigger — должны быть пропущены */
export const nodesWithoutCommandTriggers: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('trigger_start', 'command_trigger', {
    command: '/start',
    autoTransitionTo: 'msg_1',
  }),
  makeNode('msg_1', 'message', {}),
];
