/**
 * @fileoverview Фикстуры для тестирования multi-select-transition
 * @module templates/handlers/multi-select-transition/multi-select-transition.fixture
 */

import type { Node } from '@shared/schema';
import type { MultiSelectTransitionTemplateParams } from './multi-select-transition.params';

/** Тестовые данные для multi-select-transition */
export const multiSelectTransitionFixture: MultiSelectTransitionTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node1',
      data: {
        continueButtonTarget: 'node2',
        keyboardType: 'inline',
        messageText: 'Выбор завершен',
        buttons: [],
      },
    },
  ],
  nodes: [
    {
      id: 'node1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        keyboardType: 'inline',
        allowMultipleSelection: true,
        messageText: 'Выберите интересы:',
      },
    },
    {
      id: 'node2',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        keyboardType: 'none',
        messageText: 'Спасибо за выбор!',
      },
    },
  ] as unknown as Node[],
  connections: [],
  indentLevel: '        ',
};

/** Фикстура с command узлом */
export const commandTargetFixture: MultiSelectTransitionTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node1',
      data: {
        continueButtonTarget: 'node2',
      },
    },
  ],
  nodes: [
    {
      id: 'node1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        allowMultipleSelection: true,
      },
    },
    {
      id: 'node2',
      type: 'command',
      position: { x: 0, y: 0 },
      data: {
        command: 'menu',
      },
    },
  ] as unknown as Node[],
  connections: [],
  indentLevel: '        ',
};

/** Фикстура без continueButtonTarget с соединениями */
export const connectionsFixture: MultiSelectTransitionTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node1',
      data: {
        keyboardType: 'none',
      },
      connections: [{ source: 'node1', target: 'node2' }],
    },
  ],
  nodes: [
    {
      id: 'node1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        allowMultipleSelection: true,
      },
    },
    {
      id: 'node2',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        keyboardType: 'none',
        messageText: 'Переход по соединению',
      },
    },
  ] as unknown as Node[],
  connections: [{ source: 'node1', target: 'node2' }],
  indentLevel: '        ',
};

/** Фикстура с несуществующим целевым узлом */
export const missingTargetFixture: MultiSelectTransitionTemplateParams = {
  multiSelectNodes: [
    {
      id: 'node1',
      data: {
        continueButtonTarget: 'nonexistent_node',
      },
    },
  ],
  nodes: [
    {
      id: 'node1',
      type: 'message',
      position: { x: 0, y: 0 },
      data: {
        allowMultipleSelection: true,
      },
    },
  ] as unknown as Node[],
  connections: [],
  indentLevel: '        ',
};
