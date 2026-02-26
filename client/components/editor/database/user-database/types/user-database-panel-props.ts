import { UserBotData } from '@shared/schema';

/**
 * Входные параметры компонента UserDatabasePanel
 */
export interface UserDatabasePanelProps {
  /** Уникальный идентификатор проекта в базе данных */
  projectId: number;

  /** Отображаемое название проекта */
  projectName: string;

  /** Callback-функция для открытия внешней панели диалога с пользователем */
  onOpenDialogPanel?: (user: UserBotData) => void;

  /** Callback-функция для открытия внешней панели с детальной информацией о пользователе */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
}
