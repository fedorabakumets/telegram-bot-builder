/**
 * @fileoverview Определение узла установки переменных для сайдбара редактора
 *
 * Узел `set_variable` — установка переменных без HTTP-запроса.
 * Позволяет задавать, изменять и сбрасывать переменные прямо в flow.
 *
 * @module components/editor/sidebar/massive/logic/set-variable-node
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента узла установки переменных для сайдбара
 */
export const setVariableNode: ComponentDefinition = {
  id: 'set-variable-node',
  name: 'Установить переменные',
  description: 'Задать или изменить переменные без HTTP-запроса',
  icon: 'fas fa-pen',
  color: 'bg-emerald-100 text-emerald-600',
  type: 'set_variable',
  defaultData: {
    /** Список присваиваний переменных */
    assignments: [
      { id: 'assign_1', variable: '', value: '', mode: 'text' },
    ],
    /** ID следующего узла для автоперехода */
    autoTransitionTo: '',
    /** Включить автопереход */
    enableAutoTransition: false,
  },
};
