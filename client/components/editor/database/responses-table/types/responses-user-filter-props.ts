/**
 * @fileoverview Тип пропсов для фильтра пользователей
 * @description Свойства для компонента ResponsesUserFilter
 */

import type { UserBotData } from '@shared/schema';

/**
 * Свойства фильтра пользователей
 */
export interface ResponsesUserFilterProps {
  /** Список всех пользователей */
  users?: UserBotData[];
  /** Выбранный пользователь */
  selectedUser: UserBotData | null;
  /** Функция выбора пользователя */
  onSelectUser: (user: UserBotData | null) => void;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
}
