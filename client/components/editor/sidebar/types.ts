/**
 * @fileoverview Типы для компонентов sidebar редактора ботов
 * Определяет интерфейсы для состояний, пропсов и вспомогательных структур
 * @module components/editor/sidebar/types
 */

import { BotProject, ComponentDefinition } from '@shared/schema';

/**
 * Информация о перетаскиваемом листе
 */
export interface DraggedSheetInfo {
  /** Идентификатор листа */
  sheetId: string;
  /** Идентификатор проекта */
  projectId: number;
}

/**
 * Состояние drag-and-drop для проектов
 */
export interface ProjectDragState {
  /** Перетаскиваемый проект */
  draggedProject: BotProject | null;
  /** ID проекта, над которым находится курсор */
  dragOverProject: number | null;
}

/**
 * Состояние drag-and-drop для листов
 */
export interface SheetDragState {
  /** Перетаскиваемый лист */
  draggedSheet: DraggedSheetInfo | null;
  /** ID листа, над которым находится курсор */
  dragOverSheet: string | null;
}

/**
 * Состояние импорта проекта
 */
export interface ImportState {
  /** Открыт ли диалог импорта */
  isOpen: boolean;
  /** JSON текст для импорта */
  jsonText: string;
  /** Python текст для импорта */
  pythonText: string;
  /** Текст ошибки импорта */
  error: string;
}

/**
 * Состояние touch-перетаскивания для компонентов
 */
export interface TouchDragState {
  /** Компонент, который перетаскивают */
  touchedComponent: ComponentDefinition | null;
  /** Идёт ли перетаскивание */
  isDragging: boolean;
  /** Элемент, с которого началось перетаскивание */
  touchStartElement: HTMLElement | null;
}

/**
 * Состояние редактирования листа
 */
export interface EditingSheetState {
  /** ID редактируемого листа */
  editingSheetId: string | null;
  /** Новое имя листа */
  editingSheetName: string;
}

/**
 * Конфигурация макета редактора
 */
export interface LayoutConfig {
  /** Видимость холста */
  canvasVisible: boolean;
  /** Видимость заголовка */
  headerVisible: boolean;
  /** Видимость панели свойств */
  propertiesVisible: boolean;
  /** Показывать ли кнопки макета */
  showLayoutButtons: boolean;
}

/**
 * Категория компонентов в палитре
 */
export interface ComponentCategory {
  /** Название категории */
  name: string;
  /** Описание категории */
  description: string;
  /** Иконка категории */
  icon: string;
  /** Компоненты в категории */
  components: ComponentDefinition[];
  /** Свёрнута ли категория */
  collapsed: boolean;
}

/**
 * Пропсы для списка проектов
 */
export interface ProjectListProps {
  /** Список проектов */
  projects: BotProject[];
  /** Текущий активный проект */
  activeProject: BotProject | null;
  /** Состояние drag-and-drop */
  dragState: ProjectDragState;
  /** Обработчик выбора проекта */
  onProjectSelect: (project: BotProject) => void;
  /** Обработчик удаления проекта */
  onProjectDelete: (project: BotProject) => void;
  /** Обработчик начала перетаскивания */
  onDragStart: (e: React.DragEvent, project: BotProject) => void;
  /** Обработчик наведения при перетаскивании */
  onDragOver: (e: React.DragEvent, projectId: number) => void;
  /** Обработчик ухода при перетаскивании */
  onDragLeave: () => void;
  /** Обработчик сброса при перетаскивании */
  onDrop: (e: React.DragEvent, targetProject: BotProject) => void;
}

/**
 * Пропсы для палитры компонентов
 */
export interface ComponentPaletteProps {
  /** Категории компонентов */
  categories: ComponentCategory[];
  /** Состояние touch-перетаскивания */
  touchState: TouchDragState;
  /** Обработчик начала touch-перетаскивания */
  onTouchStart: (e: React.TouchEvent, component: ComponentDefinition) => void;
  /** Обработчик движения touch-перетаскивания */
  onTouchMove: (e: React.TouchEvent) => void;
  /** Обработчик конца touch-перетаскивания */
  onTouchEnd: () => void;
  /** Обработчик сворачивания/разворачивания категории */
  onToggleCategory: (categoryName: string) => void;
}

/**
 * Пропсы для управления листами
 */
export interface SheetManagerProps {
  /** Проекты */
  projects: BotProject[];
  /** Активный проект */
  activeProject: BotProject | null;
  /** Состояние drag-and-drop листов */
  sheetDragState: SheetDragState;
  /** Состояние редактирования */
  editingState: EditingSheetState;
  /** Обработчик начала перетаскивания листа */
  onSheetDragStart: (e: React.DragEvent, sheetId: string, projectId: number) => void;
  /** Обработчик наведения на лист */
  onSheetDragOver: (e: React.DragEvent, sheetId: string) => void;
  /** Обработчик ухода с листа */
  onSheetDragLeave: () => void;
  /** Обработчик сброса листа */
  onSheetDrop: (e: React.DragEvent, targetSheetId: string) => void;
  /** Обработчик начала редактирования имени */
  onEditSheetName: (sheetId: string, currentName: string) => void;
  /** Обработчик сохранения имени */
  onSaveSheetName: () => void;
  /** Обработчик отмены редактирования */
  onCancelEditSheetName: () => void;
  /** Обработчик изменения имени в процессе редактирования */
  onEditingSheetNameChange: (name: string) => void;
}

/**
 * Пропсы для кнопок макета
 */
export interface LayoutControlsProps {
  /** Конфигурация макета */
  layout: LayoutConfig;
  /** Обработчик изменения макета */
  onLayoutChange: (config: LayoutConfig) => void;
}

/**
 * Пропсы для основного компонента sidebar
 * Включает все свойства для управления sidebar, проектами и листами
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

  /** Колбэк для фокусировки на узле канваса, опционально с фокусом на кнопке и постоянной подсветкой */
  onNodeFocus?: (nodeId: string, buttonId?: string, persist?: boolean) => void;
}
