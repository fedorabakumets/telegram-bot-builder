import React from 'react';
import { Save, Clock, Check, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  isEnabled: boolean;
}

export function AutoSaveIndicator({ 
  isSaving, 
  lastSaved, 
  hasUnsavedChanges, 
  isEnabled 
}: AutoSaveIndicatorProps) {
  const getStatusInfo = () => {
    if (!isEnabled) {
      return {
        icon: AlertCircle,
        text: 'Автосохранение отключено',
        variant: 'secondary' as const,
        className: 'text-muted-foreground'
      };
    }

    if (isSaving) {
      return {
        icon: Save,
        text: 'Сохранение...',
        variant: 'default' as const,
        className: 'text-primary opacity-70'
      };
    }

    if (hasUnsavedChanges) {
      return {
        icon: Clock,
        text: 'Есть несохраненные изменения',
        variant: 'secondary' as const,
        className: 'text-orange-600 dark:text-orange-400'
      };
    }

    if (lastSaved) {
      return {
        icon: Check,
        text: 'Сохранено',
        variant: 'secondary' as const,
        className: 'text-green-600 dark:text-green-400'
      };
    }

    return {
      icon: Clock,
      text: 'Ожидание изменений',
      variant: 'secondary' as const,
      className: 'text-muted-foreground'
    };
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffMinutes < 1) {
      return `${diffSeconds} сек. назад`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes} мин. назад`;
    } else {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
              transition-all duration-200 cursor-default rounded-md border
              bg-background hover:bg-accent hover:text-accent-foreground
              ${status.className}
            `}
          >
            <StatusIcon size={12} className={isSaving ? 'opacity-60' : ''} />
            <span className="hidden sm:inline">{status.text}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <div className="font-medium">{status.text}</div>
            {lastSaved && (
              <div className="text-muted-foreground">
                Последнее сохранение: {formatLastSaved(lastSaved)}
              </div>
            )}
            {isEnabled && (
              <div className="text-muted-foreground">
                Автосохранение через 800мс после изменений
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}