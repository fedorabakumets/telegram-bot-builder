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
 * Пропсы для диалога импорта
 */
export interface ImportDialogProps {
  /** Открыт ли диалог */
  isOpen: boolean;
  /** Состояние импорта */
  importState: ImportState;
  /** Обработчик закрытия диалога */
  onClose: () => void;
  /** Обработчик изменения JSON текста */
  onJsonTextChange: (text: string) => void;
  /** Обработчик изменения Python текста */
  onPythonTextChange: (text: string) => void;
  /** Обработчик импорта */
  onImport: () => void;
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
 */
export interface ComponentsSidebarProps {
  /** Текущая активная вкладка */
  currentTab: 'elements' | 'projects';
  /** Обработчик изменения вкладки */
  onTabChange: (tab: 'elements' | 'projects') => void;
}
