/**
 * @fileoverview Свойства адаптивного заголовка
 * @description Интерфейс props для компонента AdaptiveHeader
 */

import { LayoutConfig } from '../../layout/layout-manager';
import { BotInfo } from './bot-info';
import { HeaderTab } from './header-tab';

/**
 * Свойства адаптивного заголовка
 */
export interface AdaptiveHeaderProps {
  /** Конфигурация макета */
  config: LayoutConfig;
  /** Название проекта */
  projectName: string;
  /** Информация о боте */
  botInfo?: BotInfo | null;
  /** Текущая активная вкладка */
  currentTab: HeaderTab;
  /** Обработчик изменения вкладки */
  onTabChange: (tab: HeaderTab) => void;
  /** Функция экспорта проекта */
  onExport: () => void;
  /** Функция сохранения как шаблон */
  onSaveAsTemplate?: () => void;
  /** Функция загрузки шаблона */
  onLoadTemplate?: () => void;
  /** Функция настройки макета */
  onLayoutSettings?: () => void;
  /** Функция переключения видимости заголовка */
  onToggleHeader?: () => void;
  /** Функция переключения видимости боковой панели */
  onToggleSidebar?: () => void;
  /** Функция переключения видимости панели свойств */
  onToggleProperties?: () => void;
  /** Функция переключения видимости холста */
  onToggleCanvas?: () => void;
  /** Функция переключения видимости панели кода */
  onToggleCode?: () => void;
  /** Функция переключения видимости редактора кода */
  onToggleCodeEditor?: () => void;
  /** Функция открытия проводника файлов */
  onOpenFileExplorer?: () => void;
  /** Видимость заголовка */
  headerVisible?: boolean;
  /** Видимость боковой панели */
  sidebarVisible?: boolean;
  /** Видимость панели свойств */
  propertiesVisible?: boolean;
  /** Видимость холста */
  canvasVisible?: boolean;
  /** Видимость панели кода */
  codeVisible?: boolean;
  /** Видимость редактора кода */
  codeEditorVisible?: boolean;
  /** Функция открытия мобильной боковой панели */
  onOpenMobileSidebar?: () => void;
  /** Функция открытия мобильной панели свойств */
  onOpenMobileProperties?: () => void;
}
