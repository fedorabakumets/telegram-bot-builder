/**
 * @fileoverview Компонент выбора фильтра для переменной
 * Позволяет добавить фильтр к переменной (например, join для вывода массива)
 * @module variable-filter-menu
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sliders } from 'lucide-react';
import { useState } from 'react';
import { VARIABLE_FILTER_OPTIONS } from '../utils/filter-options';

/** Пропсы компонента VariableFilterMenu */
interface VariableFilterMenuProps {
  /** Имя переменной */
  variableName: string;
  /** Функция применения фильтра к переменной */
  onApplyFilter: (variableName: string, filter: string) => void;
}

/**
 * Меню выбора фильтра для переменной
 * @param {VariableFilterMenuProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент выбора фильтра
 */
export function VariableFilterMenu({
  variableName,
  onApplyFilter
}: VariableFilterMenuProps) {
  const [open, setOpen] = useState(false);

  const handleFilterSelect = (filter: string) => {
    onApplyFilter(variableName, filter);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          title="Фильтры переменной"
          onClick={(e) => e.stopPropagation()}
        >
          <Sliders className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-gradient-to-br from-blue-50/95 to-cyan-50/95 dark:from-slate-900/95 dark:to-slate-800/95 border border-blue-200/50 dark:border-blue-800/50">
        <DropdownMenuLabel className="text-xs font-semibold text-blue-800 dark:text-blue-200">
          🔧 Фильтры для <code className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded font-mono">{`{${variableName}}`}</code>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-blue-200/30 dark:bg-blue-800/30" />
        
        {/* Фильтр join для массивов */}
        <div className="p-2">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
            📦 Для массивов:
          </div>
          {VARIABLE_FILTER_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.filter}
              className="cursor-pointer py-1.5 text-xs"
              onClick={() => handleFilterSelect(option.filter)}
            >
              <span className="flex items-center gap-2">
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </span>
              <Badge variant="secondary" className="ml-auto text-xs h-5">
                <code className="font-mono">{option.filter}</code>
              </Badge>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className="bg-blue-200/30 dark:bg-blue-800/30" />
        
        {/* Информация */}
        <div className="px-3 py-2">
          <div className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
            💡 Фильтры работают с переменными, которые сохраняются в режиме <strong>"Не перезаписывать"</strong>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
