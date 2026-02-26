/**
 * @fileoverview Типы для компонента UserDatabasePanel
 * @description Экспортирует все типы, используемые в компоненте базы данных пользователей
 */

import { UserBotData } from '@shared/schema';

/**
 * Свойства компонента UserDatabasePanel
 * @interface
 */
export interface UserDatabasePanelProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
  /** Функция для открытия панели диалога с пользователем */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Функция для открытия панели с деталями пользователя */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
}
