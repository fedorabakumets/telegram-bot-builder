/**
 * @fileoverview Типы для компонента FlexibleLayout
 * @description Интерфейсы и типы для гибкого макета интерфейса
 */

import { SimpleLayoutConfig } from '../../simple-layout-customizer';

/**
 * @interface FlexibleLayoutProps
 * @description Свойства гибкого компонента макета
 */
export interface FlexibleLayoutProps {
  /** Конфигурация макета */
  config: SimpleLayoutConfig;
  /** Контент заголовка */
  headerContent: React.ReactNode;
  /** Контент боковой панели */
  sidebarContent: React.ReactNode;
  /** Контент холста */
  canvasContent: React.ReactNode;
  /** Контент панели свойств */
  propertiesContent: React.ReactNode;
  /** Контент панели кода */
  codeContent?: React.ReactNode;
  /** Контент редактора кода */
  codeEditorContent?: React.ReactNode;
  /** Контент диалогового окна */
  dialogContent?: React.ReactNode;
  /** Контент информации о пользователе */
  userDetailsContent?: React.ReactNode;
  /** Контент панели проводника файлов */
  fileExplorerContent?: React.ReactNode;
  /** Функция обратного вызова при изменении конфигурации */
  onConfigChange?: (newConfig: SimpleLayoutConfig) => void;
  /** Скрывать боковые панели на маленьких устройствах */
  hideOnMobile?: boolean;
  /** Текущая активная вкладка */
  currentTab?: string;
}
