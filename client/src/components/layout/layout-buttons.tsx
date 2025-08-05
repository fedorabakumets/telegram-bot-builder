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
  onToggleProperties?: () => void;
  onShowFullLayout?: () => void;
  canvasVisible?: boolean;
  headerVisible?: boolean;
  propertiesVisible?: boolean;
  className?: string;
}

export function LayoutButtons({ 
  onToggleCanvas, 
  onToggleHeader, 
  onToggleProperties,
  onShowFullLayout,
  canvasVisible = false,
  headerVisible = false,
  propertiesVisible = false,
  className = "" 
}: LayoutButtonsProps) {
  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 p-2 bg-background border border-border rounded-lg ${className}`}>
        {/* Кнопка показать шапку */}
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
            <p>Показать шапку</p>
          </TooltipContent>
        </Tooltip>

        {/* Кнопка показать холст */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCanvas}
              className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Показать холст</p>
          </TooltipContent>
        </Tooltip>

        {/* Кнопка показать панель свойств */}
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
            <p>Показать панель свойств</p>
          </TooltipContent>
        </Tooltip>

        {/* Кнопка полного макета */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowFullLayout}
              className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Показать всё</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}