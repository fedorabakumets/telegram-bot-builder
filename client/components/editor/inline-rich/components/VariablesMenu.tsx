/**
 * @fileoverview Компонент меню выбора переменных
 * @description Выпадающее меню со списком доступных переменных для вставки
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { VariableMenuItem } from './variable-menu-item';
import type { Variable } from '../types';

/**
 * Свойства компонента VariablesMenu
 */
export interface VariablesMenuProps {
  /** Доступные переменные */
  availableVariables: Variable[];
  /** Функция вставки переменной */
  insertVariable: (name: string, filter?: string) => void;
  /** Функция применения фильтра к существующей переменной */
  applyFilterToVariable?: (variableName: string, filter: string) => void;
}

/**
 * Меню выбора переменных для вставки в редактор
 */
export function VariablesMenu({
  availableVariables,
  insertVariable,
  applyFilterToVariable
}: VariablesMenuProps) {
  if (availableVariables.length === 0) return null;

  return (
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
          <span className="sm:hidden">+ Переменная</span>
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
            onSelect={(name) => insertVariable(name)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
