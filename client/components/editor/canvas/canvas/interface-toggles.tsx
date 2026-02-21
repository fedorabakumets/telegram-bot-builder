/**
 * @fileoverview Компонент кнопок управления видимостью панелей интерфейса
 * 
 * Содержит кнопки для переключения видимости заголовка, боковой панели,
 * холста и панели свойств в компоненте Canvas.
 */

import { Navigation, Sidebar, Sliders, Monitor } from 'lucide-react';

/**
 * Свойства компонента кнопок управления интерфейсом
 */
interface InterfaceTogglesProps {
  /** Видимость заголовка */
  headerVisible?: boolean;
  /** Видимость боковой панели */
  sidebarVisible?: boolean;
  /** Видимость холста */
  canvasVisible?: boolean;
  /** Видимость панели свойств */
  propertiesVisible?: boolean;
  /** Колбэк переключения видимости заголовка */
  onToggleHeader?: () => void;
  /** Колбэк переключения видимости боковой панели */
  onToggleSidebar?: () => void;
  /** Колбэк переключения видимости холста */
  onToggleCanvas?: () => void;
  /** Колбэк переключения видимости панели свойств */
  onToggleProperties?: () => void;
}

/**
 * Компонент кнопок управления видимостью панелей интерфейса
 * 
 * @param props - Свойства компонента
 * @returns JSX элемент с кнопками управления
 */
export function InterfaceToggles({
  headerVisible,
  sidebarVisible,
  canvasVisible,
  propertiesVisible,
  onToggleHeader,
  onToggleSidebar,
  onToggleCanvas,
  onToggleProperties
}: InterfaceTogglesProps) {
  /**
   * Генерация классов для кнопки переключения
   */
  const getButtonClasses = (isVisible: boolean | undefined) => `
    flex-shrink-0 p-0 h-9 w-9 rounded-xl transition-colors duration-200 
    flex items-center justify-center border
    ${isVisible
      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
      : 'bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 text-slate-600 dark:text-slate-400 border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50'
    }
  `;

  return (
    <div className="flex items-center gap-2">
      {onToggleHeader && (
        <button
          onClick={onToggleHeader}
          className={getButtonClasses(headerVisible)}
          title={`${headerVisible ? 'Скрыть' : 'Показать'} шапку`}
        >
          <Navigation className="w-4 h-4" />
        </button>
      )}

      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className={getButtonClasses(sidebarVisible)}
          title={`${sidebarVisible ? 'Скрыть' : 'Показать'} боковую панель`}
        >
          <Sidebar className="w-4 h-4" />
        </button>
      )}

      {onToggleCanvas && (
        <button
          onClick={onToggleCanvas}
          className={getButtonClasses(canvasVisible)}
          title={`${canvasVisible ? 'Скрыть' : 'Показать'} холст`}
        >
          <Monitor className="w-4 h-4" />
        </button>
      )}

      {onToggleProperties && (
        <button
          onClick={onToggleProperties}
          className={getButtonClasses(propertiesVisible)}
          title={`${propertiesVisible ? 'Скрыть' : 'Показать'} панель свойств`}
        >
          <Sliders className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
