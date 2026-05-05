/**
 * @fileoverview Типы пропсов главного компонента сайдбара
 */

import type { BotInfo } from '@/components/editor/header/types/bot-info';
import type { HeaderTab } from '@/components/editor/header/types/header-tab';

export type { BotInfo, HeaderTab };

/**
 * Пропсы главного компонента AppSidebar
 */
export interface AppSidebarProps {
  /** Название проекта */
  projectName: string;
  /** Информация о боте */
  botInfo?: BotInfo | null;
  /** Текущая активная вкладка */
  currentTab: HeaderTab;
  /** Обработчик смены вкладки */
  onTabChange: (tab: HeaderTab) => void;
  /** Сохранить сценарий как шаблон */
  onSaveAsTemplate?: () => void;
  /** Загрузить сценарий из шаблона */
  onLoadTemplate?: () => void;
  /** Свёрнут ли сайдбар */
  isCollapsed?: boolean;
  /** Переключить свёрнутость сайдбара */
  onToggleCollapsed?: () => void;
  /** Видима ли шапка */
  headerVisible?: boolean;
  /** Переключить видимость шапки */
  onToggleHeader?: () => void;
}
