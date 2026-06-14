/**
 * @fileoverview Компонент селектора переменных для повторного использования
 * Использует тот же UI что и VariablesMenu для кнопки "+ Переменная"
 * @module variable-selector
 */

import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search } from 'lucide-react';
import { VariableMenuItem } from '../../../inline-rich/components/variable-menu-item';
import type { Variable } from '../../../inline-rich/types';

/** Порог, начиная с которого показывается поле поиска */
const SEARCH_THRESHOLD = 7;

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
  /** Текущий поисковый запрос по имени переменной */
  const [search, setSearch] = useState('');

  /** Показывать поле поиска только когда переменных много */
  const showSearch = availableVariables.length > SEARCH_THRESHOLD;

  /** Отфильтрованный список переменных по подстроке в имени или описании */
  const query = search.trim().toLowerCase();
  const filteredVariables = query
    ? availableVariables.filter((variable) =>
        variable.name.toLowerCase().includes(query) ||
        (variable.description?.toLowerCase().includes(query) ?? false)
      )
    : availableVariables;

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setSearch(''); }}>
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
        {showSearch && (
          <div
            className="relative px-1 pb-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Поиск переменной..."
              className="h-7 text-xs pl-7 pr-2 py-0"
            />
          </div>
        )}
        {availableVariables.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            Нет переменных. Добавьте узел со сбором медиа-ввода.
          </div>
        ) : filteredVariables.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            Ничего не найдено
          </div>
        ) : (
          filteredVariables.map((variable, index) => (
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
