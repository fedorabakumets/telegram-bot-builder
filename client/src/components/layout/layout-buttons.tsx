import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  PanelTop, 
  PanelLeft, 
  LayoutGrid,
  Eye
} from 'lucide-react';

interface LayoutButtonsProps {
  onToggleCanvas?: () => void;
  onToggleHeader?: () => void;
  onShowFullLayout?: () => void;
  canvasVisible?: boolean;
  headerVisible?: boolean;
  className?: string;
}

export function LayoutButtons({ 
  onToggleCanvas, 
  onToggleHeader, 
  onShowFullLayout,
  canvasVisible = false,
  headerVisible = false,
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
              className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
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
              className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Показать холст</p>
          </TooltipContent>
        </Tooltip>

        {/* Кнопка показать боковую панель свойств */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowFullLayout}
              className="h-8 w-8 p-0 bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Показать всё</p>
          </TooltipContent>
        </Tooltip>

        {/* Кнопка полного макета */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowFullLayout}
              className="h-8 w-8 p-0 bg-gray-500 hover:bg-gray-600 text-white"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Полный макет</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}