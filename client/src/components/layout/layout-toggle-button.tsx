import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Settings, 
  Move, 
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Grid
} from 'lucide-react';

interface LayoutToggleButtonProps {
  isEditing: boolean;
  onToggle: () => void;
  hasUnsavedChanges?: boolean;
  elementsCount?: number;
  className?: string;
}

export const LayoutToggleButton: React.FC<LayoutToggleButtonProps> = ({
  isEditing,
  onToggle,
  hasUnsavedChanges = false,
  elementsCount = 4,
  className = ''
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={onToggle}
            className={`relative ${className}`}
          >
            <Layout className="w-4 h-4 mr-2" />
            {isEditing ? 'Редактор макета' : 'Настроить макет'}
            
            {hasUnsavedChanges && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            {isEditing ? (
              <div>
                <p className="font-medium">Режим редактирования активен</p>
                <p className="text-xs text-muted-foreground">
                  Перетащите элементы для изменения макета
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Настроить расположение элементов</p>
                <p className="text-xs text-muted-foreground">
                  Управление позицией панелей и размерами
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs">Элементов:</span>
                  <Badge variant="secondary" className="text-xs">
                    {elementsCount}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface QuickLayoutControlsProps {
  onMoveHeader: (position: 'top' | 'bottom') => void;
  onToggleSidebar: () => void;
  onToggleProperties: () => void;
  onResetLayout: () => void;
  headerPosition: 'top' | 'bottom';
  sidebarVisible: boolean;
  propertiesVisible: boolean;
  className?: string;
}

export const QuickLayoutControls: React.FC<QuickLayoutControlsProps> = ({
  onMoveHeader,
  onToggleSidebar,
  onToggleProperties,
  onResetLayout,
  headerPosition,
  sidebarVisible,
  propertiesVisible,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <TooltipProvider>
        {/* Быстрое перемещение шапки */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveHeader(headerPosition === 'top' ? 'bottom' : 'top')}
            >
              {headerPosition === 'top' ? (
                <ArrowDown className="w-4 h-4" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Переместить шапку {headerPosition === 'top' ? 'вниз' : 'вверх'}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Переключение боковой панели */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
            >
              {sidebarVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {sidebarVisible ? 'Скрыть' : 'Показать'} боковую панель
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Переключение панели свойств */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleProperties}
            >
              {propertiesVisible ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {propertiesVisible ? 'Скрыть' : 'Показать'} панель свойств
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Сброс макета */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetLayout}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Сбросить макет к умолчанию</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

interface LayoutStatusIndicatorProps {
  config: {
    elements: Array<{
      id: string;
      type: string;
      position: string;
      visible: boolean;
      size: number;
    }>;
    lastModified: Date;
  };
  className?: string;
}

export const LayoutStatusIndicator: React.FC<LayoutStatusIndicatorProps> = ({
  config,
  className = ''
}) => {
  const visibleElements = config.elements.filter(el => el.visible);
  const customized = config.elements.some(el => 
    (el.type === 'header' && el.position !== 'top') ||
    (el.type === 'sidebar' && el.position !== 'left') ||
    (el.type === 'properties' && el.position !== 'right') ||
    !el.visible
  );

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        {customized && (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
        <span className="text-xs text-muted-foreground">
          {visibleElements.length}/{config.elements.length} элементов
        </span>
      </div>
      
      <Badge variant={customized ? "default" : "secondary"} className="text-xs">
        {customized ? 'Настроен' : 'По умолчанию'}
      </Badge>
    </div>
  );
};