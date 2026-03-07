/**
 * @fileoverview Компонент панели инструментов редактора
 * @description Содержит кнопки форматирования, истории и вставки переменных
 */

import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  RotateCw,
  Copy
} from 'lucide-react';
import type { FormatOption } from '../format-options';

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
  /** Компонент меню переменных */
  variablesMenu: React.ReactNode;
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
  variablesMenu
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

      {/* Меню переменных */}
      {variablesMenu}
    </div>
  );
}
