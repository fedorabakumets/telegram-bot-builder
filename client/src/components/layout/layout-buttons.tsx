import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Send, 
  PanelLeftClose, 
  MessageSquare, 
  LayoutGrid 
} from 'lucide-react';

interface LayoutButtonsProps {
  onSendToChat?: () => void;
  onToggleCanvas?: () => void;
  onToggleHeader?: () => void;
  onShowFullLayout?: () => void;
  canvasVisible?: boolean;
  headerVisible?: boolean;
  className?: string;
}

export function LayoutButtons({ 
  onSendToChat, 
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
        {/* Кнопка отправки в чат */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSendToChat}
              className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Отправить в чат</p>
          </TooltipContent>
        </Tooltip>

        {/* Кнопка переключения холста */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCanvas}
              className={`h-8 w-8 p-0 ${
                canvasVisible 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{canvasVisible ? 'Скрыть холст' : 'Показать холст'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Кнопка переключения сообщений/чата */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleHeader}
              className={`h-8 w-8 p-0 ${
                headerVisible 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{headerVisible ? 'Скрыть шапку' : 'Показать шапку'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Кнопка полного макета */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowFullLayout}
              className="h-8 w-8 p-0 bg-muted hover:bg-muted/80 text-muted-foreground"
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