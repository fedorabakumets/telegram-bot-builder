/**
 * @fileoverview Компактная панель инструментов редактора
 * @description Уменьшенная версия toolbar для диалоговых окон
 */

import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  RotateCw,
  Copy
} from 'lucide-react';
import type { FormatOption } from '../format-options';

/**
 * Свойства компонента CompactToolbar
 */
export interface CompactToolbarProps {
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
}

/**
 * Компактная панель инструментов с кнопками форматирования
 */
export function CompactToolbar({
  formatOptions,
  applyFormatting,
  undo,
  redo,
  canUndo,
  canRedo,
  copyFormatted
}: CompactToolbarProps) {
  return (
    <div className="flex items-center gap-1 bg-white dark:bg-slate-900/50 rounded-lg p-1 border border-slate-200/50 dark:border-slate-800/50">
      {formatOptions.map((format) => (
        <Button
          key={format.command}
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
          onClick={() => applyFormatting(format)}
          title={`${format.name} (${format.shortcut})`}
        >
          <format.icon className="h-3.5 w-3.5" />
        </Button>
      ))}
      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 disabled:opacity-40"
        onClick={undo}
        disabled={!canUndo}
        title="Отменить (Ctrl+Z)"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 disabled:opacity-40"
        onClick={redo}
        disabled={!canRedo}
        title="Повторить (Ctrl+Shift+Z)"
      >
        <RotateCw className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
        onClick={copyFormatted}
        title="Копировать форматированный текст"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
