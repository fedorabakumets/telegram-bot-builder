/**
 * @fileoverview Компонент заголовка боковой панели
 * Содержит переключатель вкладок и кнопки управления
 * @module components/editor/sidebar/components/sidebar-header
 */

import { Button } from '@/components/ui/button';
import { LayoutButtons } from '@/components/layout/layout-buttons';
import { X } from 'lucide-react';

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
}: SidebarHeaderProps) {
  return (
    <div className="p-4 border-b border-border/30 bg-gradient-to-r from-slate-50/50 dark:from-slate-900/30 to-transparent">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
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
      <div className="flex space-x-1 bg-gradient-to-r from-slate-200/40 to-slate-100/20 dark:from-slate-800/40 dark:to-slate-700/20 rounded-lg p-1 backdrop-blur-sm border border-slate-300/20 dark:border-slate-600/20">
        <button
          onClick={() => onTabChange('elements')}
          className={`flex-1 px-2 py-2 text-xs font-semibold rounded-md transition-all duration-200 ${
            currentTab === 'elements'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-slate-700/30'
          }`}
        >
          Элементы
        </button>
        <button
          onClick={() => onTabChange('projects')}
          className={`flex-1 px-2 py-2 text-xs font-semibold rounded-md transition-all duration-200 ${
            currentTab === 'projects'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-slate-700/30'
          }`}
        >
          Проекты
        </button>
      </div>
    </div>
  );
}
