import React from 'react';
import { Clock, Save, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TemplateAutoSaveIndicatorProps {
  isSaving: boolean;
  isCreating: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  templateId: number | null;
  className?: string;
  showLabel?: boolean;
  instantMode?: boolean;
}

export function TemplateAutoSaveIndicator({
  isSaving,
  isCreating,
  lastSaved,
  hasUnsavedChanges,
  templateId,
  className,
  showLabel = true,
  instantMode = false
}: TemplateAutoSaveIndicatorProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'только что'; // менее минуты
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`; // менее часа
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatus = () => {
    if (isCreating) {
      return {
        icon: <Sparkles className="h-3 w-3 opacity-70" />,
        text: 'Создание шаблона...',
        variant: 'secondary' as const,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30'
      };
    }
    
    if (isSaving) {
      return {
        icon: <Loader2 className="h-3 w-3 opacity-70" />,
        text: templateId ? 'Обновление...' : 'Сохранение...',
        variant: 'secondary' as const,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/30'
      };
    }
    
    if (hasUnsavedChanges) {
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        text: instantMode ? 'Автосохранение...' : 'Есть изменения',
        variant: 'destructive' as const,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30'
      };
    }
    
    if (lastSaved) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: templateId ? 'Шаблон обновлен' : 'Шаблон сохранен',
        variant: 'default' as const,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/30'
      };
    }
    
    return {
      icon: <Save className="h-3 w-3" />,
      text: 'Готов к сохранению',
      variant: 'outline' as const,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/30'
    };
  };

  const status = getStatus();
  
  const tooltipContent = () => {
    if (isCreating) return 'Создается новый шаблон...';
    if (isSaving) return 'Сохраняются изменения...';
    if (hasUnsavedChanges) return instantMode ? 'Автосохранение активно' : 'Есть несохраненные изменения';
    if (lastSaved) return `Последнее сохранение: ${formatTime(lastSaved)}`;
    return 'Автосохранение шаблонов';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center space-x-2", className)}>
            <Badge 
              variant={status.variant}
              className={cn(
                "flex items-center space-x-1.5 transition-all duration-300",
                status.bgColor,
                status.color,
                "border-0 shadow-sm"
              )}
            >
              {status.icon}
              {showLabel && <span className="text-xs font-medium">{status.text}</span>}
            </Badge>
            
            {/* Дополнительная информация для режима создания */}
            {isCreating && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full opacity-40"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full opacity-60"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full opacity-80"></div>
                </div>
              </div>
            )}
            
            {/* Время последнего сохранения */}
            {lastSaved && !hasUnsavedChanges && !isSaving && !isCreating && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTime(lastSaved)}</span>
              </div>
            )}
            
            {/* Индикатор мгновенного режима */}
            {instantMode && !isSaving && !isCreating && (
              <Badge 
                variant="outline" 
                className="text-xs px-1 py-0 h-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
              >
                ⚡ Мгновенно
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{tooltipContent()}</p>
            {templateId && (
              <p className="text-xs text-muted-foreground">ID шаблона: {templateId}</p>
            )}
            {instantMode && (
              <p className="text-xs text-purple-600 dark:text-purple-400">
                🚀 Режим мгновенного сохранения
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Компактная версия для небольших пространств
export function CompactTemplateAutoSaveIndicator({
  isSaving,
  isCreating,
  hasUnsavedChanges,
  lastSaved,
  className
}: Pick<TemplateAutoSaveIndicatorProps, 'isSaving' | 'isCreating' | 'hasUnsavedChanges' | 'lastSaved' | 'className'>) {
  const getStatusIcon = () => {
    if (isCreating) return <Sparkles className="h-4 w-4 text-blue-500 opacity-70" />;
    if (isSaving) return <Loader2 className="h-4 w-4 text-orange-500 opacity-70" />;
    if (hasUnsavedChanges) return <AlertCircle className="h-4 w-4 text-amber-500" />;
    if (lastSaved) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Save className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("p-1.5 rounded-full hover:bg-muted/50 transition-colors", className)}>
            {getStatusIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isCreating && "Создается шаблон..."}
            {isSaving && !isCreating && "Сохраняется..."}
            {hasUnsavedChanges && !isSaving && !isCreating && "Есть изменения"}
            {!hasUnsavedChanges && !isSaving && !isCreating && lastSaved && "Сохранено"}
            {!hasUnsavedChanges && !isSaving && !isCreating && !lastSaved && "Готово"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}