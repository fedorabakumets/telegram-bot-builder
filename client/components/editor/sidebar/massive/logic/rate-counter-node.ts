/**
 * @fileoverview Определение ноды rate_counter для палитры компонентов
 * @module components/editor/sidebar/massive/logic/rate-counter-node
 */

import { ComponentDefinition } from '@shared/schema';

/** Узел подсчёта событий в скользящем окне */
export const rateCounterNode: ComponentDefinition = {
  id: 'rate-counter-node',
  name: '📊 Счётчик частоты',
  description: 'In-memory счётчик событий в скользящем временном окне',
  icon: 'fas fa-chart-line',
  color: 'bg-sky-100 text-sky-600',
  type: 'rate_counter' as any,
  defaultData: {
    counterKey: '',
    windowSeconds: '60',
    saveResultTo: 'rate_count',
    autoTransitionTo: '',
    enableAutoTransition: false,
  },
};
