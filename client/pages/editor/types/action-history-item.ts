/**
 * @fileoverview Интерфейс элемента истории действий
 *
 * Используется для отслеживания изменений в редакторе.
 */

import type { ActionType } from './action-type';

/** Элемент истории действий пользователя */
export interface ActionHistoryItem {
  /** Уникальный идентификатор действия */
  id: string;
  /** Тип выполненного действия */
  type: ActionType;
  /** Текстовое описание действия */
  description: string;
  /** Временная метка выполнения действия */
  timestamp: number;
}
