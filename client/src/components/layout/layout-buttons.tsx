import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  PanelTop,
  PanelLeft,
  LayoutGrid,
  PanelRight,
  EyeOff,
  Eye
} from 'lucide-react';

/**
 * @interface LayoutButtonsProps
 * @description Свойства компонента кнопок управления макетом
 * @property {() => void} [onToggleCanvas] - Функция переключения видимости холста
 * @property {() => void} [onToggleHeader] - Функция переключения видимости заголовка
 * @property {() => void} [onToggleSidebar] - Функция переключения видимости боковой панели
 * @property {() => void} [onToggleProperties] - Функция переключения видимости панели свойств
 * @property {() => void} [onShowFullLayout] - Функция отображения полного макета
 * @property {boolean} [canvasVisible] - Видимость холста
 * @property {boolean} [headerVisible] - Видимость заголовка
 * @property {boolean} [sidebarVisible] - Видимость боковой панели
 * @property {boolean} [propertiesVisible] - Видимость панели свойств
 * @property {string} [className] - Дополнительный CSS класс
 */
interface LayoutButtonsProps {
  onToggleCanvas?: () => void;
  onToggleHeader?: () => void;
  onToggleSidebar?: () => void;
  onToggleProperties?: () => void;
  onShowFullLayout?: () => void;
  canvasVisible?: boolean;
  headerVisible?: boolean;
  sidebarVisible?: boolean;
  propertiesVisible?: boolean;
  className?: string;
}

/**
 * @function LayoutButtons
 * @description Компонент кнопок управления макетом интерфейса
 * Предоставляет кнопки для переключения видимости различных элементов интерфейса
 * @param {LayoutButtonsProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент кнопок управления макетом
 */
export function LayoutButtons({
  onToggleCanvas,
  onToggleHeader,
  onToggleSidebar,
  onToggleProperties,
  onShowFullLayout,
  canvasVisible = true,
  headerVisible = true,
  sidebarVisible = true,
  propertiesVisible = true,
  className = ""
}: LayoutButtonsProps) {
  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 p-2 bg-background border border-border rounded-lg ${className}`}>
        {/* Кнопка переключения шапки - всегда видна */}
        {onToggleHeader && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleHeader}
                className={`h-8 w-8 p-0 rounded-md ${
                  headerVisible 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                }`}
              >
                <PanelTop className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{headerVisible ? 'Скрыть шапку' : 'Показать шапку'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Кнопка переключения боковой панели - всегда видна */}
        {onToggleSidebar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className={`h-8 w-8 p-0 rounded-md ${
                  sidebarVisible 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                }`}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{sidebarVisible ? 'Скрыть боковую панель' : 'Показать боковую панель'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Кнопка переключения холста - всегда видна */}
        {onToggleCanvas && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCanvas}
                className={`h-8 w-8 p-0 rounded-md ${
                  canvasVisible 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{canvasVisible ? 'Скрыть холст' : 'Показать холст'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Кнопка переключения панели свойств - всегда видна */}
        {onToggleProperties && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleProperties}
                className={`h-8 w-8 p-0 rounded-md ${
                  propertiesVisible 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                }`}
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{propertiesVisible ? 'Скрыть панель свойств' : 'Показать панель свойств'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Дополнительные кнопки управления */}
        {(() => {
          const visiblePanels = [headerVisible, sidebarVisible, canvasVisible, propertiesVisible].filter(Boolean).length;
          const hiddenPanels = 4 - visiblePanels;

          // Если видна только одна панель - показываем кнопку "Скрыть текущую"
          if (visiblePanels === 1) {
            let currentVisibleAction;
            let currentVisibleIcon;
            let currentVisibleTooltip;

            if (sidebarVisible) {
              currentVisibleAction = onToggleSidebar;
              currentVisibleIcon = <EyeOff className="h-4 w-4" />;
              currentVisibleTooltip = "Скрыть боковую панель";
            } else if (headerVisible) {
              currentVisibleAction = onToggleHeader;
              currentVisibleIcon = <EyeOff className="h-4 w-4" />;
              currentVisibleTooltip = "Скрыть шапку";
            } else if (canvasVisible) {
              currentVisibleAction = onToggleCanvas;
              currentVisibleIcon = <EyeOff className="h-4 w-4" />;
              currentVisibleTooltip = "Скрыть холст";
            } else if (propertiesVisible) {
              currentVisibleAction = onToggleProperties;
              currentVisibleIcon = <EyeOff className="h-4 w-4" />;
              currentVisibleTooltip = "Скрыть панель свойств";
            }

            return currentVisibleAction && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={currentVisibleAction}
                    className="h-8 w-8 p-0 bg-orange-600 hover:bg-orange-700 text-white rounded-md"
                  >
                    {currentVisibleIcon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{currentVisibleTooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          
          // Если скрыто несколько панелей - показываем кнопку "Показать всё"
          if (hiddenPanels > 1 && onShowFullLayout) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShowFullLayout}
                    className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Показать все панели</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return null;
        })()}
      </div>
    </TooltipProvider>
  );
}