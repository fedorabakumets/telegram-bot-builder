/**
 * @fileoverview Определение ноды задержки для палитры компонентов
 * @module components/editor/sidebar/massive/logic/delay-node
 */

import { ComponentDefinition } from '@shared/schema';

/** Определение ноды задержки */
export const delayNode: ComponentDefinition = {
  id: 'delay-node',
  name: '⏱ Задержка',
  description: 'Пауза или фоновый таймер перед следующим действием',
  icon: 'fas fa-hourglass-half',
  color: 'bg-amber-100 text-amber-600',
  type: 'delay',
  defaultData: {
    /** Задержка в секундах (поддерживает {переменные}) */
    seconds: '3',
    /** Режим: blocking — пауза, background — фоновый таймер */
    mode: 'blocking',
    /** ID следующего узла для автоперехода */
    autoTransitionTo: '',
    /** Включить автопереход */
    enableAutoTransition: false,
  },
};
