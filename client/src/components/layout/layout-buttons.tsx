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
      </div>
    </TooltipProvider>
  );
}