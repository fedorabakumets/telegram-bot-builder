/**
 * @fileoverview Универсальная панель инструментов редактора
 * @description Поддерживает обычный и компактный режимы через проп `compact`
 */

import { Button } from '@/components/ui/button';
import { RotateCcw, RotateCw, Copy, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { VariableMenuItem } from './variable-menu-item';
import { LinkPopover } from './LinkPopover';
import type { FormatOption } from '../format-options';
import type { Variable } from '../types';
import type { UseLinkPopoverReturn } from '../hooks/useLinkPopover';

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
  /** Данные попапа ссылки (опционально) */
  linkPopover?: UseLinkPopoverReturn;
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
  linkPopover
}: ToolbarProps) {
  if (compact) {
    return (
      <>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900/50 rounded-lg p-1 border border-slate-200/50 dark:border-slate-800/50">
          {formatOptions.map((format) => (
            <Button key={format.command} variant="ghost" size="icon"
              className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              onClick={() => applyFormatting(format)} title={`${format.name} (${format.shortcut})`}>
              <format.icon className="h-3.5 w-3.5" />
            </Button>
          ))}
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <Button variant="ghost" size="icon"
            className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 disabled:opacity-40"
            onClick={undo} disabled={!canUndo} title="Отменить (Ctrl+Z)">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon"
            className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 disabled:opacity-40"
            onClick={redo} disabled={!canRedo} title="Повторить (Ctrl+Shift+Z)">
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon"
            className="h-7 w-7 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
            onClick={copyFormatted} title="Копировать форматированный текст">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        {linkPopover && (
          <LinkPopover
            isOpen={linkPopover.isOpen}
            currentUrl={linkPopover.currentUrl}
            position={linkPopover.position}
            onApply={linkPopover.applyLink}
            onRemove={linkPopover.removeLink}
            onClose={linkPopover.closeLinkPopover}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          {formatOptions.map((format) => (
            <Button key={format.command} variant="ghost" size="sm"
              onClick={() => applyFormatting(format)}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
              title={`${format.name} (${format.shortcut})`}>
              <format.icon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            </Button>
          ))}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm"
                className="h-8 sm:h-9 px-2.5 sm:px-3 gap-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-600/15 hover:from-blue-500/20 hover:to-cyan-500/15 border border-blue-300/40 dark:border-blue-600/40 transition-all"
                title="Вставить переменную">
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
                <VariableMenuItem key={`${variable.nodeId}-${variable.name}-${index}`}
                  variable={variable} onSelect={insertVariable} />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {linkPopover && (
        <LinkPopover
          isOpen={linkPopover.isOpen}
          currentUrl={linkPopover.currentUrl}
          position={linkPopover.position}
          onApply={linkPopover.applyLink}
          onRemove={linkPopover.removeLink}
          onClose={linkPopover.closeLinkPopover}
        />
      )}
    </>
  );
}
