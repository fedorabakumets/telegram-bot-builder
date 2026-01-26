import { Navigation, Sidebar, Sliders, Monitor } from 'lucide-react';

interface LayoutToggleButtonsProps {
  onToggleHeader?: () => void;
  onToggleSidebar?: () => void;
  onToggleProperties?: () => void;
  onToggleCanvas?: () => void;
  headerVisible?: boolean;
  sidebarVisible?: boolean;
  propertiesVisible?: boolean;
  canvasVisible?: boolean;
}

export function LayoutToggleButtons({
  onToggleHeader,
  onToggleSidebar,
  onToggleProperties,
  onToggleCanvas,
  headerVisible,
  sidebarVisible,
  propertiesVisible,
  canvasVisible
}: LayoutToggleButtonsProps) {
  if (!(onToggleHeader || onToggleSidebar || onToggleProperties || onToggleCanvas)) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center space-x-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-1">
        {onToggleHeader && (
          <button
            onClick={onToggleHeader}
            className={`p-2 rounded-md transition-all duration-200 ${
              headerVisible 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
            title={`${headerVisible ? 'Скрыть' : 'Показать'} шапку`}
          >
            <Navigation className="w-4 h-4" />
          </button>
        )}
        
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-md transition-all duration-200 ${
              sidebarVisible 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
            title={`${sidebarVisible ? 'Скрыть' : 'Показать'} боковую панель`}
          >
            <Sidebar className="w-4 h-4" />
          </button>
        )}
        
        {onToggleCanvas && (
          <button
            onClick={onToggleCanvas}
            className={`p-2 rounded-md transition-all duration-200 ${
              canvasVisible 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
            title={`${canvasVisible ? 'Скрыть' : 'Показать'} холст`}
          >
            <Monitor className="w-4 h-4" />
          </button>
        )}
        
        {onToggleProperties && (
          <button
            onClick={onToggleProperties}
            className={`p-2 rounded-md transition-all duration-200 ${
              propertiesVisible 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
            title={`${propertiesVisible ? 'Скрыть' : 'Показать'} панель свойств`}
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}