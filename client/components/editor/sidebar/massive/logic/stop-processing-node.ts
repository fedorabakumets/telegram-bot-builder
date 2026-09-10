/**
 * @fileoverview Определение ноды stop_processing для палитры компонентов
 * @module components/editor/sidebar/massive/logic/stop-processing-node
 */

import { ComponentDefinition } from '@shared/schema';

/** Узел остановки обработки middleware-цепочки */
export const stopProcessingNode: ComponentDefinition = {
  id: 'stop-processing-node',
  name: '🛑 Стоп обработки',
  description: 'Устанавливает флаг _stop_processing — следующий middleware не вызывается',
  icon: 'fas fa-hand-paper',
  color: 'bg-red-100 text-red-600',
  type: 'stop_processing' as any,
  defaultData: {
    autoTransitionTo: '',
    enableAutoTransition: false,
  },
};
