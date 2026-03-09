/**
 * @fileoverview Компонент панели инструментов редактора
 * @description Содержит кнопки форматирования, истории и вставки переменных
 */

import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  RotateCw,
  Copy,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { VariableMenuItem } from './variable-menu-item';
import type { FormatOption } from '../format-options';
import type { Variable } from '../types';

/**
 * Свойства компонента EditorToolbar
 */
export interface EditorToolbarProps {
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
  /** Доступные переменные */
  availableVariables?: Variable[];
  /** Функция вставки переменной */
  insertVariable?: (name: string) => void;
}

/**
 * Панель инструментов редактора с кнопками форматирования
 */
export function EditorToolbar({
  formatOptions,
  applyFormatting,
  undo,
  redo,
  canUndo,
  canRedo,
  copyFormatted,
  availableVariables = [],
  insertVariable
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Кнопки форматирования */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        {formatOptions.map((format) => (
          <Button
            key={format.command}
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting(format)}
            className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
            title={`${format.name} (${format.shortcut})`}
          >
            <format.icon className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
          </Button>
        ))}
      </div>

      {/* Кнопки истории и копирования */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-40"
          title="Отменить (Ctrl+Z)"
        >
          <RotateCcw className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-40"
          title="Повторить (Ctrl+Shift+Z)"
        >
          <RotateCw className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={copyFormatted}
          className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          title="Копировать форматированный текст"
        >
          <Copy className="h-4 sm:h-4 w-4 sm:w-4 text-slate-700 dark:text-slate-300" />
        </Button>
      </div>

      {/* Кнопка вставки переменных */}
      {availableVariables.length > 0 && insertVariable && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 sm:h-9 px-2.5 sm:px-3 gap-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-600/15 hover:from-blue-500/20 hover:to-cyan-500/15 dark:hover:from-blue-600/30 dark:hover:to-cyan-600/25 border border-blue-300/40 dark:border-blue-600/40 hover:border-blue-400/60 dark:hover:border-blue-500/60 transition-all"
              title="Вставить переменную"
            >
              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Переменная</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 sm:w-64">
            <DropdownMenuLabel className="text-xs sm:text-sm font-semibold">
              📌 Доступные переменные
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableVariables.map((variable, index) => (
              <VariableMenuItem
                key={`${variable.nodeId}-${variable.name}-${index}`}
                variable={variable}
                onSelect={insertVariable}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
