/**
 * @fileoverview Типы пропсов панели базы данных пользователей
 */

import { BotToken, UserBotData } from '@shared/schema';

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
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** Список доступных токенов проекта */
  availableTokens?: BotToken[];
  /** Обработчик выбора токена бота */
  onSelectToken?: (tokenId: number | null) => void;
}
