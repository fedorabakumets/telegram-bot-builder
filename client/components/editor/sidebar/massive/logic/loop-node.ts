/**
 * @fileoverview Определение узла Loop (цикл по массиву) для палитры сайдбара
 * @module components/editor/sidebar/massive/logic/loop-node
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента узла цикла для сайдбара
 */
export const loopNode: ComponentDefinition = {
  id: 'loop-node',
  name: '🔄 Цикл (Loop)',
  description: 'Цикл по массиву — выполнить цепочку для каждого элемента',
  icon: 'fas fa-sync-alt',
  color: 'bg-violet-100 text-violet-600',
  type: 'loop',
  defaultData: {
    /** Имя переменной с массивом */
    sourceVariable: '',
    /** Имя переменной для текущего элемента */
    itemVariable: 'item',
    /** Имя переменной для индекса итерации */
    indexVariable: 'index',
    /** Параллельное выполнение (asyncio.gather) */
    parallel: false,
    /** Пауза между итерациями в секундах */
    delaySeconds: 0,
    /** Максимум итераций (0 = без лимита) */
    maxIterations: 0,
    /** ID первой ноды тела цикла */
    autoTransitionTo: '',
    /** ID ноды после завершения цикла */
    afterLoopTo: '',
    /** Включить автопереход в тело */
    enableAutoTransition: true,
    /** Кнопки (не используются, для совместимости) */
    buttons: [],
    /** Тип клавиатуры (не используется, для совместимости) */
    keyboardType: 'none',
    /** Текст сообщения (не используется, для совместимости) */
    messageText: '',
  },
};
