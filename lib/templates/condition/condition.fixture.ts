/**
 * @fileoverview Тестовые данные для шаблона обработчиков узлов условия
 * @module templates/condition/condition.fixture
 */

import type { ConditionTemplateParams } from './condition.params';
import type { Node } from '@shared/schema';

// ─── Вспомогательная функция ─────────────────────────────────────────────────

function makeNode(id: string, type: string, data: Record<string, any>): Node {
  return { id, type, data, position: { x: 0, y: 0 } } as unknown as Node;
}

// ─── Низкоуровневые фикстуры (ConditionTemplateParams) ───────────────────────

/** Пустой массив узлов условия */
export const validParamsEmpty: ConditionTemplateParams = {
  entries: [],
};

/**
 * Узел условия с ветками filled / empty / else
 * Проверяет, заполнено ли имя пользователя
 */
export const validParamsFilledEmpty: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_name',
      variable: 'user_name',
      branches: [
        { id: 'b1', operator: 'filled', value: '', target: 'msg_greet' },
        { id: 'b2', operator: 'empty', value: '', target: 'msg_ask_name' },
        { id: 'b3', operator: 'else', value: '', target: 'msg_fallback' },
      ],
    },
  ],
};

/**
 * Узел условия с ветками equals / else
 * Проверяет роль пользователя
 */
export const validParamsEquals: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_role',
      variable: 'user_role',
      branches: [
        { id: 'b1', operator: 'equals', value: 'admin', target: 'msg_admin_panel' },
        { id: 'b2', operator: 'equals', value: 'moderator', target: 'msg_mod_panel' },
        { id: 'b3', operator: 'else', value: '', target: 'msg_user_panel' },
      ],
    },
  ],
};

/** Несколько узлов условия */
export const validParamsMultiple: ConditionTemplateParams = {
  entries: [
    ...validParamsFilledEmpty.entries,
    ...validParamsEquals.entries,
  ],
};

// ─── Высокоуровневые фикстуры (Node[]) для collectConditionEntries ────────────

/** Один condition-узел с ветками filled / empty / else */
export const nodesWithConditionFilledEmpty: Node[] = [
  makeNode('condition_check_name', 'condition', {
    variable: 'user_name',
    branches: [
      { id: 'b1', label: 'Заполнено', operator: 'filled', value: '', target: 'msg_greet' },
      { id: 'b2', label: 'Пусто', operator: 'empty', value: '', target: 'msg_ask_name' },
      { id: 'b3', label: 'Иначе', operator: 'else', value: '' },
    ],
  }),
  makeNode('msg_greet', 'message', { messageText: 'Привет!' }),
  makeNode('msg_ask_name', 'message', { messageText: 'Как тебя зовут?' }),
];

/** Один condition-узел с ветками equals / else */
export const nodesWithConditionEquals: Node[] = [
  makeNode('condition_check_role', 'condition', {
    variable: 'user_role',
    branches: [
      { id: 'b1', label: 'Админ', operator: 'equals', value: 'admin', target: 'msg_admin_panel' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '', target: 'msg_user_panel' },
    ],
  }),
  makeNode('msg_admin_panel', 'message', {}),
  makeNode('msg_user_panel', 'message', {}),
];

/** condition-узел без variable — должен быть пропущен */
export const nodesWithMissingVariable: Node[] = [
  makeNode('condition_bad', 'condition', {
    variable: '',
    branches: [{ id: 'b1', label: 'Иначе', operator: 'else', value: '' }],
  }),
];

/** condition-узел без веток — должен быть пропущен */
export const nodesWithNoBranches: Node[] = [
  makeNode('condition_empty', 'condition', {
    variable: 'user_name',
    branches: [],
  }),
];

/** Узлы без condition — должны быть пропущены */
export const nodesWithoutCondition: Node[] = [
  makeNode('start_1', 'start', {}),
  makeNode('msg_1', 'message', { messageText: 'Привет' }),
];

/** null-узлы и смешанный массив */
export const nodesWithNullAndMixed: Node[] = [
  null as unknown as Node,
  makeNode('condition_check_name', 'condition', {
    variable: 'user_name',
    branches: [
      { id: 'b1', label: 'Заполнено', operator: 'filled', value: '', target: 'msg_greet' },
      { id: 'b2', label: 'Иначе', operator: 'else', value: '' },
    ],
  }),
  makeNode('msg_greet', 'message', {}),
];
