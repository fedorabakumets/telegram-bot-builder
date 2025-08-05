import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  PanelTop, 
  PanelLeft, 
  LayoutGrid,
  PanelRight
} from 'lucide-react';

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
        {/* Кнопка скрыть шапку - показывается только когда шапка видна */}
        {headerVisible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleHeader}
                className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
              >
                <PanelTop className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Скрыть шапку</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Кнопка скрыть боковую панель - показывается только когда боковая панель видна */}
        {sidebarVisible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Скрыть боковую панель</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Кнопка скрыть холст - показывается только когда холст виден */}
        {canvasVisible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCanvas}
                className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Скрыть холст</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Кнопка скрыть панель свойств - показывается только когда панель свойств видна */}
        {propertiesVisible && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleProperties}
                className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Скрыть панель свойств</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Кнопка показать всё - показывается когда что-то скрыто */}
        {(!headerVisible || !sidebarVisible || !canvasVisible || !propertiesVisible) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"  
                size="sm"
                onClick={onShowFullLayout}
                className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Показать всё</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}