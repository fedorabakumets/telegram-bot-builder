/**
 * @fileoverview Компонент пустого состояния макета
 * @description Отображается, когда все панели скрыты
 */

import React from 'react';
import { Navigation, Sidebar, Sliders, Monitor } from 'lucide-react';
import { SimpleLayoutConfig } from '../../simple-layout-customizer';

/**
 * Пропсы компонента EmptyState
 */
interface EmptyStateProps {
  /** Конфигурация макета */
  config: SimpleLayoutConfig;
  /** Флаг мобильного режима */
  isMobile: boolean;
  /** Скрывать панели на мобильных */
  hideOnMobile: boolean;
  /** Функция изменения конфигурации */
  onConfigChange?: (newConfig: SimpleLayoutConfig) => void;
}

/**
 * Компонент пустого состояния с кнопками включения панелей
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function EmptyState(props: EmptyStateProps): React.JSX.Element {
  const { config, isMobile, hideOnMobile, onConfigChange } = props;

  const toggleElement = (elementId: string) => {
    if (!onConfigChange) return;
    const newConfig = { ...config };
    const element = newConfig.elements.find(el => el.id === elementId);
    if (element) {
      element.visible = true;
      onConfigChange(newConfig);
    }
  };

  const isMobileMode = hideOnMobile && isMobile;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-background relative">
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium mb-2">
          {isMobileMode ? 'Мобильный режим' : 'Все панели скрыты'}
        </h3>
        <p className="text-sm">
          {isMobileMode
            ? 'На мобильных устройствах боковые панели скрыты для экономии места'
            : 'Используйте кнопки ниже для показа панелей'
          }
        </p>
      </div>

      <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-3">
        <button
          onClick={() => toggleElement('header')}
          className="p-3 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
          title="Показать шапку"
        >
          <Navigation className="w-5 h-5" />
        </button>

        <button
          onClick={() => toggleElement('sidebar')}
          className="p-3 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
          title="Показать боковую панель"
        >
          <Sidebar className="w-5 h-5" />
        </button>

        <button
          onClick={() => toggleElement('canvas')}
          className="p-3 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
          title="Показать холст"
        >
          <Monitor className="w-5 h-5" />
        </button>

        <button
          onClick={() => toggleElement('properties')}
          className="p-3 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
          title="Показать панель свойств"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
