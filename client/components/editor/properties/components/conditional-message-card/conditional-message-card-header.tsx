/**
 * @fileoverview Заголовок карточки условного сообщения
 * 
 * Отображает номер, название, индикаторы ошибок и кнопки управления приоритетом.
 */

import { Button } from '@/components/ui/button';

/** Пропсы заголовка карточки условия */
interface ConditionalMessageCardHeaderProps {
  /** Индекс условия */
  index: number;
  /** Названия переменных условия */
  variableNames?: string[];
  /** Приоритет условия */
  priority?: number;
  /** Флаг наличия ошибок */
  hasErrors: boolean;
  /** Флаг наличия предупреждений */
  hasWarnings: boolean;
  /** Функция повышения приоритета */
  onIncreasePriority: () => void;
  /** Функция понижения приоритета */
  onDecreasePriority: () => void;
  /** Функция удаления условия */
  onDelete: () => void;
}

/**
 * Компонент заголовка карточки условного сообщения
 * 
 * @param {ConditionalMessageCardHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок карточки условия
 */
export function ConditionalMessageCardHeader({
  index,
  variableNames,
  priority,
  hasErrors,
  hasWarnings,
  onIncreasePriority,
  onDecreasePriority,
  onDelete
}: ConditionalMessageCardHeaderProps) {
  return (
    <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/50 dark:border-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-300/60 to-purple-400/60 dark:from-purple-800/50 dark:to-purple-700/50 text-xs font-bold text-purple-900 dark:text-purple-100 flex-shrink-0 shadow-sm">
          {index + 1}
        </span>
        <span className="text-xs sm:text-sm font-medium text-foreground truncate">
          {variableNames?.join(', ')?.slice(0, 30) || 'Условие'}
        </span>
        {hasErrors && (
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex-shrink-0 animate-pulse shadow-lg shadow-red-500/30" title="Ошибка"></div>
        )}
        {hasWarnings && !hasErrors && (
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex-shrink-0 shadow-lg shadow-yellow-500/20" title="Предупреждение"></div>
        )}
      </div>
      <div className="flex items-center gap-1 justify-end">
        <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100/60 to-blue-100/60 dark:from-purple-900/40 dark:to-blue-900/40 px-2 py-1 rounded-md border border-purple-300/40 dark:border-purple-700/40 text-xs font-medium text-purple-700 dark:text-purple-300 flex-shrink-0 shadow-sm">
          <i className="fas fa-fire text-xs"></i>
          <span className="hidden sm:inline">{priority || 0}</span>
          <span className="inline sm:hidden text-xs font-bold">{Math.floor((priority || 0) / 10)}</span>
        </div>
        <div className="h-5 w-px bg-border/40"></div>
        <Button size="sm" variant="ghost" onClick={onIncreasePriority} className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/40 dark:hover:bg-blue-900/30 rounded transition-all hover:scale-110" title="Повысить приоритет">
          <i className="fas fa-chevron-up text-xs"></i>
        </Button>
        <Button size="sm" variant="ghost" onClick={onDecreasePriority} className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/40 dark:hover:bg-blue-900/30 rounded transition-all hover:scale-110" title="Понизить приоритет">
          <i className="fas fa-chevron-down text-xs"></i>
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100/40 dark:hover:bg-red-900/30 rounded transition-all hover:scale-110" title="Удалить">
          <i className="fas fa-xmark text-xs"></i>
        </Button>
      </div>
    </div>
  );
}
