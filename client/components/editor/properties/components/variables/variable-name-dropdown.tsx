/**
 * @fileoverview Компонент выпадающего списка для выбора имени переменной
 * Позволяет выбрать существующую переменную или ввести новую.
 * @module variable-name-dropdown
 */

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

/** Пропсы компонента VariableNameDropdown */
interface VariableNameDropdownProps {
  /** Текущее значение переменной */
  value: string;
  /** Список доступных имён переменных */
  availableVariables: string[];
  /** Функция обновления значения */
  onChange: (value: string) => void;
  /** Placeholder для input */
  placeholder?: string;
}

/**
 * Выпадающий список для выбора имени переменной.
 * Отображает список существующих переменных и позволяет ввести новую.
 * @param {VariableNameDropdownProps} props - Пропсы компонента
 * @returns {JSX.Element} Dropdown компонент с выбором переменной
 */
export function VariableNameDropdown({
  value,
  availableVariables,
  onChange,
  placeholder = 'имя переменной'
}: VariableNameDropdownProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Синхронизируем inputValue с внешним value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = (variable: string) => {
    onChange(variable);
    setInputValue(variable);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-1">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              className="flex-1 text-xs sm:text-sm border-cyan-200/50 dark:border-cyan-700/50 focus:border-cyan-500 focus:ring-cyan-200"
              placeholder={placeholder}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-l-0 rounded-l-none border-cyan-200/50 dark:border-cyan-700/50"
              title="Выбрать из списка"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 sm:w-64 bg-gradient-to-br from-cyan-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-cyan-200/50 dark:border-cyan-800/50 shadow-lg"
        >
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-cyan-800 dark:text-cyan-200">
              📌 Существующие переменные
            </div>
          </div>
          <DropdownMenuSeparator className="bg-cyan-200/30 dark:bg-cyan-800/30" />
          <div className="max-h-48 overflow-y-auto p-1">
            {availableVariables.length > 0 ? (
              availableVariables.map((variable) => (
                <DropdownMenuItem
                  key={variable}
                  onClick={() => handleSelect(variable)}
                  className="cursor-pointer px-2 py-1.5 text-xs hover:bg-cyan-100/50 dark:hover:bg-cyan-900/30"
                >
                  <code className="text-xs font-mono text-cyan-700 dark:text-cyan-300">
                    {variable}
                  </code>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-3 py-4 text-center">
                <div className="text-xs text-cyan-600 dark:text-cyan-400">
                  Нет существующих переменных
                </div>
              </div>
            )}
          </div>
          <DropdownMenuSeparator className="bg-cyan-200/30 dark:bg-cyan-800/30" />
          <div className="px-3 py-2">
            <div className="text-xs text-cyan-600 dark:text-cyan-400">
              💡 Введите новое имя или выберите из списка
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
