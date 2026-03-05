/**
 * @fileoverview Компонент подсказки с предупреждением
 * Отображает иконку и tooltip с информацией о возможных потерях сообщений
 */

import { AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Свойства подсказки с предупреждением
 */
interface WarningTooltipProps {
  /** Текст предупреждения */
  message?: string;
  /** Дополнительная подсказка */
  hint?: string;
}

/**
 * Компонент подсказки с предупреждением
 */
export function WarningTooltip({
  message = 'Панель в разработке',
  hint = 'Отправка, отображение и сохранение сообщений могут работать некорректно'
}: WarningTooltipProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          aria-label={message}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-[240px] bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
      >
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
          {message}
        </p>
        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
          {hint}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
