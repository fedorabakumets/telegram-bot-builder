/** @fileoverview Поиск реальных значений переменной с численностью людей и выбором точного совпадения. */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { UserVariableOptions } from '@shared/user-variable-options';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
/** Подписывает пустую строку и пробелы, не меняя значение сравнения. */
function valueLabel(value: string): string { return value === '' ? 'Пустая строка' : !value.trim() ? 'Пробелы' : value; }
/**
 * Загружает подходящие значения через поиск и применяет выбранное без ручного ввода.
 * @param props - Значения, количества и обработчики выбора/поиска.
 * @returns Селектор с поиском по полному набору значений на сервере.
 */
export function VariableValueSelector({ data, value, count, loading, search, onSearch, onSelect, placeholder = 'Выберите значение' }: {
  /** Подпись до выбора точного совпадения. */ placeholder?: string;
  /** Результат справочника. */ data?: UserVariableOptions;
  /** Выбранное точное значение. */ value?: string;
  /** Количество людей с текущим значением. */ count?: number;
  /** Запрос выполняется. */ loading: boolean;
  /** Поиск по значениям. */ search: string;
  /** Изменение поиска. */ onSearch: (value: string) => void;
  /** Выбор точного значения. */ onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: Array<{ /** Значение. */ value: string; /** Численность. */ count?: number }> = [...(data?.values ?? [])];
  if (!search && value !== undefined && !options.some(option => option.value === value)) options.unshift({ value, count });
  /** Численность не подменяется нулём во время запроса. */
  const number = (count?: number) => count === undefined ? '—' : count.toLocaleString('ru-RU');
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) onSearch(''); }}><PopoverTrigger asChild>
    <button type="button" role="combobox" aria-label="Значение переменной" aria-expanded={open} title={value}
      className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm">
      <span className="min-w-0 truncate">{value === undefined ? placeholder : valueLabel(value)}</span>
      {value !== undefined && <span className="shrink-0 text-xs text-muted-foreground">{number(count)}</span>}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  </PopoverTrigger><PopoverContent align="start" className="users-portal w-80 max-w-[calc(100vw-32px)] p-0">
    <Command shouldFilter={false}><CommandInput placeholder="Поиск значения…" aria-label="Поиск значения переменной"
      maxLength={200} value={search} onValueChange={onSearch} />
      <CommandList className="max-h-60"><CommandEmpty>{loading ? 'Загрузка значений…' : 'Значения не найдены'}</CommandEmpty>
        {options.map(option => <CommandItem key={option.value} value={JSON.stringify(option.value)} onSelect={() => {
          onSelect(option.value); setOpen(false);
        }} className="flex min-w-0 justify-between gap-3">
          <span className="min-w-0 truncate" title={option.value}>{valueLabel(option.value)}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{number(option.count)}</span>
        </CommandItem>)}
      </CommandList>
      {data?.hasMoreValues && <p className="border-t border-border p-3 text-xs text-muted-foreground">Показаны первые 200 значений. Уточните поиск.</p>}
    </Command>
  </PopoverContent></Popover>;
}
