/**
 * @fileoverview Компонент заголовка боковой панели
 * Содержит переключатель вкладок и кнопки управления
 * @module components/editor/sidebar/components/sidebar-header
 */

import { useEditorAppearance } from '@/components/editor/shared/use-editor-appearance';
import { Button } from '@/components/ui/button';
import { LayoutButtons } from '@/components/layout/layout-buttons';
import { X } from 'lucide-react';
import { ProjectsViewToggle, type ProjectsViewMode } from './projects-view-toggle';

/**
 * Пропсы компонента заголовка
 */
export interface SidebarHeaderProps {
  /** Текущая активная вкладка */
  currentTab: 'elements' | 'projects';
  /** Обработчик изменения вкладки */
  onTabChange: (tab: 'elements' | 'projects') => void;
  /** Видимость холста */
  canvasVisible?: boolean;
  /** Видимость заголовка */
  headerVisible?: boolean;
  /** Видимость панели свойств */
  propertiesVisible?: boolean;
  /** Показывать ли кнопки макета */
  showLayoutButtons?: boolean;
  /** Колбэк для переключения видимости холста */
  onToggleCanvas?: () => void;
  /** Колбэк для переключения видимости заголовка */
  onToggleHeader?: () => void;
  /** Колбэк для переключения видимости панели свойств */
  onToggleProperties?: () => void;
  /** Колбэк для показа полного макета */
  onShowFullLayout?: () => void;
  /** Колбэк для закрытия панели */
  onClose?: () => void;
  /** Режим списка проектов (активные / архив) */
  projectsView?: ProjectsViewMode;
  /** Смена режима списка проектов */
  onProjectsViewChange?: (view: ProjectsViewMode) => void;
}

/**
 * Компонент заголовка боковой панели
 * @param props - Пропсы заголовка
 * @returns JSX элемент заголовка
 */
export function SidebarHeader({
  currentTab,
  onTabChange,
  showLayoutButtons = false,
  canvasVisible,
  headerVisible,
  propertiesVisible,
  onToggleCanvas,
  onToggleHeader,
  onToggleProperties,
  onShowFullLayout,
  onClose,
  projectsView = 'active',
  onProjectsViewChange,
}: SidebarHeaderProps) {
  const activeStyle = useEditorAppearance('underlineTabs') ? 'text-foreground underline decoration-2 underline-offset-4' : 'bg-blue-600 text-white';
  return (
    <div className="px-4 py-2 border-b border-border/30 bg-gradient-to-r from-zinc-50/50 dark:from-zinc-900/30 to-transparent">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="text-lg font-bold text-foreground">
          Компоненты
        </h2>
        <div className="flex items-center gap-1">
          {showLayoutButtons && (
            <LayoutButtons
              onToggleCanvas={onToggleCanvas}
              onToggleHeader={onToggleHeader}
              onToggleProperties={onToggleProperties}
              onShowFullLayout={onShowFullLayout}
              canvasVisible={canvasVisible}
              headerVisible={headerVisible}
              propertiesVisible={propertiesVisible}
              className="scale-75 -mr-2"
            />
          )}
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 flex-shrink-0"
              onClick={onClose}
              title="Закрыть панель компонентов"
              data-testid="button-close-components-sidebar"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex gap-1 px-1">
        <button
          aria-pressed={currentTab === 'elements'}
          onClick={() => onTabChange('elements')}
          className={`flex-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors duration-200 ${
            currentTab === 'elements'
              ? activeStyle
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Элементы
        </button>
        <button
          aria-pressed={currentTab === 'projects'}
          onClick={() => onTabChange('projects')}
          className={`flex-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors duration-200 ${
            currentTab === 'projects'
              ? activeStyle
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Проекты
        </button>
      </div>
      {currentTab === 'projects' && onProjectsViewChange && (
        <div className="mt-1.5">
          <ProjectsViewToggle value={projectsView} onChange={onProjectsViewChange} />
        </div>
      )}
    </div>
  );
}
