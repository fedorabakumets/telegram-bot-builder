/**
 * @fileoverview Тестовые данные для шаблона узла set_variable
 * @module templates/set-variable/set-variable.fixture
 */

import type { SetVariableTemplateParams } from './set-variable.params';
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

// ─── Низкоуровневые фикстуры (SetVariableTemplateParams) ─────────────────────

/** Узел без присваиваний */
export const validParamsEmpty: SetVariableTemplateParams = {
  nodeId: 'node_1',
  assignments: [],
  autoTransitionTo: '',
};

/** Один assignment в режиме text */
export const validParamsSingle: SetVariableTemplateParams = {
  nodeId: 'node_2',
  assignments: [
    { id: 'a1', variable: 'username', value: '{first_name}', mode: 'text' },
  ],
  autoTransitionTo: '',
};

/** Один assignment в режиме expression */
export const validParamsExpression: SetVariableTemplateParams = {
  nodeId: 'node_3',
  assignments: [
    { id: 'a2', variable: 'step', value: '{step} + 1', mode: 'expression' },
  ],
  autoTransitionTo: 'node_next',
};

/** Несколько assignments смешанных режимов */
export const validParamsMultiple: SetVariableTemplateParams = {
  nodeId: 'node_4',
  assignments: [
    { id: 'a3', variable: 'name', value: '{first_name}', mode: 'text' },
    { id: 'a4', variable: 'count', value: '{count} + 1', mode: 'expression' },
    { id: 'a5', variable: 'status', value: 'active', mode: 'text' },
  ],
  autoTransitionTo: 'node_5',
};

// ─── Высокоуровневые фикстуры (Node[]) для collectSetVariableEntries ──────────

/** Один set_variable узел + message узел */
export const nodesWithSetVariable: Node[] = [
  makeNode('sv_1', 'set_variable', {
    assignments: [{ id: 'a1', variable: 'score', value: '0', mode: 'text' }],
    autoTransitionTo: 'msg_1',
  }),
  makeNode('msg_1', 'message', { messageText: 'Готово!' }),
];

/** set_variable без поля assignments */
export const nodesWithMissingAssignments: Node[] = [
  makeNode('sv_bad', 'set_variable', { autoTransitionTo: '' }),
];

/** Только start + message — нет set_variable */
export const nodesWithoutSetVariable: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узел + set_variable + message */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('sv_1', 'set_variable', {
    assignments: [{ id: 'a1', variable: 'x', value: '1', mode: 'text' }],
    autoTransitionTo: '',
  }),
  makeNode('msg_1', 'message', {}),
];
