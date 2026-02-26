/**
 * @fileoverview Типы для компонента UserDatabasePanel
 * @description Определяет входные параметры (props) для основного компонента панели базы данных пользователей
 * @module
 */

import { UserBotData } from '@shared/schema';

/**
 * Входные параметры компонента UserDatabasePanel
 * @interface UserDatabasePanelProps
 * @description Определяет обязательные и опциональные свойства для инициализации компонента
 */
export interface UserDatabasePanelProps {
  /**
   * Уникальный идентификатор проекта в базе данных
   * @type {number}
   * @required
   */
  projectId: number;

  /**
   * Отображаемое название проекта
   * @type {string}
   * @required
   */
  projectName: string;

  /**
   * Callback-функция для открытия внешней панели диалога с пользователем
   * @type {(user: UserBotData) => void}
   * @param {UserBotData} user - Данные пользователя для начала диалога
   * @optional
   * @description Если не передана, используется встроенное модальное окно диалога
   */
  onOpenDialogPanel?: (user: UserBotData) => void;

  /**
   * Callback-функция для открытия внешней панели с детальной информацией о пользователе
   * @type {(user: UserBotData) => void}
   * @param {UserBotData} user - Данные пользователя для просмотра деталей
   * @optional
   * @description Если не передана, используется встроенное модальное окно деталей
   */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
}
