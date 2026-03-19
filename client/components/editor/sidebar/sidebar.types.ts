/**
 * @fileoverview Типы и интерфейсы для компонента боковой панели редактора
 * Определяет пропсы и конфигурацию для ComponentsSidebar
 * @module components/editor/sidebar/sidebar.types
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Свойства компонента боковой панели с компонентами
 */
export interface ComponentsSidebarProps {
  /** Колбэк при начале перетаскивания компонента */
  onComponentDrag: (component: ComponentDefinition) => void;

  /** Колбэк при добавлении компонента */
  onComponentAdd?: (component: ComponentDefinition) => void;

  /** Колбэк при выборе проекта */
  onProjectSelect?: (projectId: number) => void;

  /** Идентификатор текущего проекта */
  currentProjectId?: number;

  /** Идентификатор активного листа */
  activeSheetId?: string | undefined;

  /** Колбэк для переключения видимости холста */
  onToggleCanvas?: () => void;

  /** Колбэк для переключения видимости заголовка */
  onToggleHeader?: () => void;

  /** Колбэк для переключения видимости панели свойств */
  onToggleProperties?: () => void;

  /** Колбэк для показа полного макета */
  onShowFullLayout?: () => void;

  /** Колбэк для изменения конфигурации макета */
  onLayoutChange?: (newConfig: any) => void;

  /** Колбэк для перехода к проектам */
  onGoToProjects?: () => void;

  /** Колбэк для добавления листа */
  onSheetAdd?: (name: string) => void;

  /** Содержимое заголовка */
  headerContent?: React.ReactNode;

  /** Содержимое боковой панели */
  sidebarContent?: React.ReactNode;

  /** Содержимое холста */
  canvasContent?: React.ReactNode;

  /** Содержимое панели свойств */
  propertiesContent?: React.ReactNode;

  /** Видимость холста */
  canvasVisible?: boolean;

  /** Видимость заголовка */
  headerVisible?: boolean;

  /** Видимость панели свойств */
  propertiesVisible?: boolean;

  /** Показывать ли кнопки макета */
  showLayoutButtons?: boolean;

  /** Колбэк для удаления листа */
  onSheetDelete?: (sheetId: string) => void;

  /** Колбэк для переименования листа */
  onSheetRename?: (sheetId: string, name: string) => void;

  /** Колбэк для дублирования листа */
  onSheetDuplicate?: (sheetId: string) => void;

  /** Колбэк для выбора листа */
  onSheetSelect?: (sheetId: string) => void;

  /** Флаг мобильного режима */
  isMobile?: boolean;

  /** Колбэк для закрытия панели */
  onClose?: () => void;
}
