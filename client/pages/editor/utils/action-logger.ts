/**
 * @fileoverview Логирование действий редактора
 *
 * Создаёт элементы истории для отслеживания изменений.
 */

import type { ActionType, ActionHistoryItem } from '../types';

/**
 * Создаёт элемент истории действий
 *
 * @param type - Тип действия
 * @param description - Описание действия
 * @returns Элемент истории
 */
export function createActionHistoryItem(
  type: ActionType,
  description: string
): ActionHistoryItem {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    description,
    timestamp: Date.now()
  };
}

/**
 * Хук для логирования действий в историю
 *
 * @param setActionHistory - Функция обновления истории
 * @returns Функция логирования
 */
export function createLogger(
  setActionHistory: React.Dispatch<React.SetStateAction<ActionHistoryItem[]>>
) {
  return function logAction(type: string, description: string) {
    const newAction: ActionHistoryItem = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as ActionType,
      description,
      timestamp: Date.now()
    };
    setActionHistory(prev => [newAction, ...prev].slice(0, 50));
  };
}
