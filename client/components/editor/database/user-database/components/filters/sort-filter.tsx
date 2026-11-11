/**
 * @fileoverview Компонент фильтра сортировки пользователей
 * @description Select для сортировки по различным полям и направлениям
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import { SortField, SortDirection } from '../../types';

/**
 * Пропсы компонента SortFilter
 */
interface SortFilterProps {
  /** Текущее поле сортировки */
  sortField: SortField;
  /** Текущее направление */
  sortDirection: SortDirection;
  /** Функция изменения сортировки */
  onChange: (field: SortField, direction: SortDirection) => void;
}

/**
 * Компонент фильтра сортировки
 * @param props - Пропсы компонента
 * @returns JSX компонент фильтра
 */
export function SortFilter({
  sortField,
  sortDirection,
  onChange,
}: SortFilterProps): React.JSX.Element {
  return (
    <Select
      value={`${sortField}-${sortDirection}`}
      onValueChange={(value) => {
        const [field, direction] = value.split('-') as [SortField, SortDirection];
        onChange(field, direction);
      }}
    >
      <SelectTrigger
        className="h-10 w-full min-w-0 rounded-lg border border-border/60 bg-background text-sm shadow-none transition-colors hover:bg-muted/40 [&>span]:truncate"
        aria-label="Сортировка пользователей"
        data-testid="select-sort-filter"
      >
        <div className="flex min-w-0 items-center gap-2 [&>span]:truncate">
          <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="Сортировка" />
        </div>
      </SelectTrigger>
      <SelectContent className="users-portal">
        <SelectItem value="lastInteraction-desc">Сначала активные</SelectItem>
        <SelectItem value="lastInteraction-asc">Давно не заходили</SelectItem>
        <SelectItem value="interactionCount-desc">Больше сообщений</SelectItem>
        <SelectItem value="interactionCount-asc">Меньше сообщений</SelectItem>
        <SelectItem value="createdAt-desc">Сначала новые</SelectItem>
        <SelectItem value="createdAt-asc">Сначала старые</SelectItem>
        <SelectItem value="firstName-asc">Имя А-Я</SelectItem>
        <SelectItem value="firstName-desc">Имя Я-А</SelectItem>
      </SelectContent>
    </Select>
  );
}
