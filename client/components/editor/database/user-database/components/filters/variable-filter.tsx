/** @fileoverview Выбор переменной с поиском и количеством людей для каждого условия заполненности. */
import { useState } from 'react';
import { Braces, ChevronDown } from 'lucide-react';
import type { AdvancedUserFilters } from '@shared/user-advanced-filters';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { AdvancedChoice } from './advanced-filter-inputs';
import { AdvancedFilterPopover } from './advanced-filter-popover';
import { useVariableOptions } from './use-variable-options';
import { VariableValueSelector } from './variable-value-selector';
/**
 * Показывает существующие переменные и количества без собственного условия переменной.
 * @param props - Область списка и редактируемый черновик.
 * @returns Селектор переменной и её условия в общем стиле фильтров.
 */
export function VariableFilter({ projectId, tokenId, search, value, onChange }: {
  /** Проект аудитории. */ projectId: number;
  /** Выбранный бот либо все боты. */ tokenId: number | null;
  /** Текущий поиск пользователей. */ search: string;
  /** Черновик дополнительных фильтров. */ value: AdvancedUserFilters;
  /** Изменение черновика. */ onChange: (value: AdvancedUserFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [valueSearch, setValueSearch] = useState('');
  const { data, loading, error } = useVariableOptions({ projectId, tokenId, search, value, enabled: open, valueSearch });
  const selected = data?.variables.find(variable => variable.name === value.variableName);
  const filled = data && value.variableName ? selected?.filled ?? 0 : undefined;
  const empty = data && filled !== undefined ? Math.max(0, data.total - filled) : undefined;
  const equals = data && value.variableName ? selected?.equals ?? 0 : undefined;
  /** Подтверждённый ноль отличается от ещё не загруженного количества. */
  const label = (text: string, count?: number) => `${text} · ${count === undefined ? '—' : count.toLocaleString('ru-RU')}`;
  return <AdvancedFilterPopover icon={Braces} label="Переменная пользователя" onOpenChange={next => { setOpen(next); if (!next) setSelectorOpen(false); }} summary={value.variableName
    ? `${value.variableName}: ${value.variableMode === 'equals' ? value.variableValue ?? '' : value.variableMode === 'empty' ? 'пустая' : 'заполнена'}` : undefined}>
    <Popover open={selectorOpen} onOpenChange={setSelectorOpen}><PopoverTrigger asChild>
      <button type="button" role="combobox" aria-label="Имя переменной" aria-expanded={selectorOpen} title={value.variableName}
        className="flex h-10 w-full min-w-0 items-center justify-between rounded-lg border border-border bg-background px-3 text-sm">
        <span className="truncate">{value.variableName || 'Выберите переменную'}</span><ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </PopoverTrigger><PopoverContent align="start" className="users-portal w-80 max-w-[calc(100vw-32px)] p-0">
      <Command><CommandInput placeholder="Поиск переменной…" aria-label="Поиск переменной" />
        <CommandList className="max-h-60"><CommandEmpty>{loading ? 'Загрузка переменных…' : error || 'Переменные не найдены'}</CommandEmpty>
          <CommandItem value="menu:all" onSelect={() => { onChange({ ...value, variableName: undefined, variableMode: undefined, variableValue: undefined }); setSelectorOpen(false); }}>Без фильтра по переменной</CommandItem>
          {(data?.variables ?? []).map(variable => <CommandItem key={variable.name} value={`key:${variable.name}`} onSelect={() => {
            onChange({ ...value, variableName: variable.name, variableMode: 'filled', variableValue: undefined });
            setValueSearch(''); setSelectorOpen(false);
          }}><span className="truncate" title={variable.name}>{variable.name}</span></CommandItem>)}
        </CommandList>
      </Command>
    </PopoverContent></Popover>
    <AdvancedChoice icon={Braces} label="Условие переменной" value={value.variableMode ?? 'filled'} disabled={!value.variableName}
      onChange={next => onChange({ ...value, variableMode: next as AdvancedUserFilters['variableMode'] })}
      options={[[ 'filled', label('Заполнена', filled) ], ['empty', label('Пустая или отсутствует', empty)], ['equals', label('Равна значению', equals)]]} />
    {value.variableName && <VariableValueSelector data={data} loading={loading}
      value={value.variableMode === 'equals' ? value.variableValue : undefined} count={equals}
      placeholder={value.variableMode === 'equals' ? 'Выберите значение' : 'Значения переменной'}
      search={valueSearch} onSearch={setValueSearch} onSelect={next => onChange({ ...value, variableMode: 'equals', variableValue: next })} />}
    {loading && <p className="text-xs text-muted-foreground">Загрузка количеств…</p>}
    {error && <p role="status" className="text-xs text-muted-foreground">{error}</p>}
    {data && !data.variables.length && <p className="text-xs text-muted-foreground">В выбранной аудитории переменных нет.</p>}
  </AdvancedFilterPopover>;
}
