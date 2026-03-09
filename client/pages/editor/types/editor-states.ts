/**
 * @fileoverview Типы состояний UI редактора
 *
 * Содержит интерфейсы для состояний компонента Editor.
 *
 * @module EditorStates
 */

import type { UserBotData, BotDataWithSheets } from '@shared/schema';
import type { NodeSizeMap } from './node-size';
import type { ActionHistoryItem } from './action-history-item';
import type { EditorTab, PreviousEditorTab } from './editor-common-types';

/**
 * Состояния модальных окон и панелей
 */
export interface EditorUIStates {
  /** Выбранный пользователь для диалога */
  selectedDialogUser: UserBotData | null;
  /** Выбранный пользователь для деталей */
  selectedUserDetails: UserBotData | null;
  /** Флаг загрузки шаблона */
  isLoadingTemplate: boolean;
  /** Флаг отображения менеджера макета */
  showLayoutManager: boolean;
  /** Флаг отображения мобильной панели свойств */
  showMobileProperties: boolean;
  /** Флаг отображения мобильного сайдбара */
  showMobileSidebar: boolean;
}

/**
 * Состояния системы листов
 */
export interface EditorSheetStates {
  /** Данные проекта с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Размеры узлов */
  currentNodeSizes: NodeSizeMap;
  /** История действий */
  actionHistory: ActionHistoryItem[];
  /** ID последнего загруженного проекта */
  lastLoadedProjectId: number | null;
  /** Флаг локальных изменений */
  hasLocalChanges: boolean;
}

/**
 * Состояния вкладок и навигации
 */
export interface EditorTabStates {
  /** Текущая вкладка */
  currentTab: EditorTab;
  /** Предыдущая вкладка */
  previousTab: PreviousEditorTab;
}
