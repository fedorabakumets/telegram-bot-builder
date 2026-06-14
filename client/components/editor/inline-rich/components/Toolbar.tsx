/**
 * @fileoverview Универсальная панель инструментов редактора
 * @description Поддерживает обычный и компактный режимы через проп `compact`
 */

import { Button } from '@/components/ui/button';
import { RotateCcw, RotateCw, Copy } from 'lucide-react';
import { cn } from '@/utils/utils';
import { VariablesMenu } from './VariablesMenu';
import type { FormatOption } from '../format-options';
import type { Variable } from '../types';

/**
 * Свойства компонента Toolbar
 */
export interface ToolbarProps {
  /** Опции форматирования */
  formatOptions: FormatOption[];
  /** Функция применения форматирования */
  applyFormatting: (format: FormatOption) => void;
  /** Функция отмены действия */
  undo: () => void;
  /** Функция повтора действия */
  redo: () => void;
  /** Доступен ли undo */
  canUndo: boolean;
  /** Доступен ли redo */
  canRedo: boolean;
  /** Функция копирования в буфер */
  copyFormatted: () => void;
  /** Компактный режим отображения */
  compact?: boolean;
  /** Доступные переменные (только в обычном режиме) */
  availableVariables?: Variable[];
  /** Функция вставки переменной (только в обычном режиме) */
  insertVariable?: (name: string) => void;
  /** Набор активных команд форматирования в позиции курсора */
  activeFormats?: Set<string>;
}

/**
 * Универсальная панель инструментов редактора
 * @param props - Свойства компонента
 * @returns JSX элемент панели инструментов
 */
export function Toolbar({
  formatOptions,
  applyFormatting,
  undo,
  redo,
  canUndo,
  canRedo,
  copyFormatted,
  compact = false,
  availableVariables = [],
  insertVariable,
  activeFormats
}: ToolbarProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-900/50 rounded-lg p-1 border border-slate-200/50 dark:border-slate-800/50">
        {formatOptions.map((format) => {
          const isActive = activeFormats?.has(format.command) ?? false;
          return (
            <Button key={format.command} variant="ghost" size="icon"
              className={cn(
                "h-7 w-7 transition-colors shrink-0",
                isActive
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200/80 dark:hover:bg-blue-800/50"
                  : "hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFormatting(format)} title={`${format.name} (${format.shortcut})`}>
              <format.icon className={cn(
                "h-3.5 w-3.5",
                isActive ? "text-blue-600 dark:text-blue-400" : ""
              )} />
            </Button>
          );
        })}
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />
        <Button variant="ghost" size="icon"
          className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 disabled:opacity-40 shrink-0"
          onClick={undo} disabled={!canUndo} title="Отменить (Ctrl+Z)">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon"
          className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 disabled:opacity-40 shrink-0"
          onClick={redo} disabled={!canRedo} title="Повторить (Ctrl+Shift+Z)">
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon"
          className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 shrink-0"
          onClick={copyFormatted} title="Копировать форматированный текст">
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        {formatOptions.map((format) => {
          const isActive = activeFormats?.has(format.command) ?? false;
          return (
            <Button key={format.command} variant="ghost" size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyFormatting(format)}
              className={cn(
                "h-8 sm:h-9 w-8 sm:w-9 p-0 transition-colors",
                isActive
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200/80 dark:hover:bg-blue-800/50"
                  : "hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              )}
              title={`${format.name} (${format.shortcut})`}>
              <format.icon className={cn(
                "h-4 w-4",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
              )} />
            </Button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}
          className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-40"
          title="Отменить (Ctrl+Z)">
          <RotateCcw className="h-4 w-4 text-slate-700 dark:text-slate-300" />
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo}
          className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-40"
          title="Повторить (Ctrl+Shift+Z)">
          <RotateCw className="h-4 w-4 text-slate-700 dark:text-slate-300" />
        </Button>
        <Button variant="ghost" size="sm" onClick={copyFormatted}
          className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          title="Копировать форматированный текст">
          <Copy className="h-4 w-4 text-slate-700 dark:text-slate-300" />
        </Button>
      </div>
      {availableVariables.length > 0 && insertVariable && (
        <VariablesMenu
          availableVariables={availableVariables}
          insertVariable={insertVariable}
        />
      )}
    </div>
  );
}
