/**
 * @fileoverview Определение узла условия для сайдбара редактора
 *
 * Узел `condition` — ветвление потока (аналог IF/Switch).
 * Проверяет переменную и направляет поток по одной из веток.
 *
 * @module components/editor/sidebar/massive/logic/condition-node
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента узла условия для сайдбара
 */
export const conditionNode: ComponentDefinition = {
  id: 'condition-node',
  name: 'Условие',
  description: 'Ветвление потока по значению переменной',
  icon: 'fas fa-code-branch',
  color: 'bg-violet-100 text-violet-600',
  type: 'condition',
  defaultData: {
    /** Переменная для проверки */
    variable: '',
    /** Ветки условия */
    branches: [
      { id: 'branch_filled', label: 'Да, заполнено', operator: 'filled', value: '' },
      { id: 'else', label: 'Нет', operator: 'else', value: '' },
    ],
  },
};
