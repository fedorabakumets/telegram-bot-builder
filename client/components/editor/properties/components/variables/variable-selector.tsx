/**
 * @fileoverview Компонент селектора переменных для повторного использования
 * Использует тот же UI что и VariablesMenu для кнопки "+ Переменная"
 * @module variable-selector
 */

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { VariableMenuItem } from '../../../inline-rich/components/variable-menu-item';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы компонента VariableSelector */
interface VariableSelectorProps {
  /** Доступные переменные */
  availableVariables: Variable[];
  /** Функция выбора переменной */
  onSelect: (variableName: string) => void;
  /** Trigger для dropdown (опционально) */
  trigger?: React.ReactNode;
}

/**
 * Компонент селектора переменных для повторного использования
 * @param {VariableSelectorProps} props - Пропсы компонента
 * @returns {JSX.Element} Селектор переменных
 */
export function VariableSelector({
  availableVariables,
  onSelect,
  trigger
}: VariableSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
            title="Выбрать из списка"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 sm:w-64">
        <DropdownMenuLabel className="text-xs sm:text-sm font-semibold">
          📌 Доступные переменные
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableVariables.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            Нет переменных. Добавьте узел со сбором медиа-ввода.
          </div>
        ) : (
          availableVariables.map((variable, index) => (
            <VariableMenuItem
              key={`${variable.nodeId}-${variable.name}-${index}`}
              variable={variable}
              onSelect={onSelect}
            />
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
