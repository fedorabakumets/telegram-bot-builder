/**
 * @fileoverview Компонент фильтра сортировки пользователей
 * @description Select для сортировки по различным полям и направлениям
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import { SortField, SortDirection } from '../../types';
import { useDirectoryControls } from '../../content/user-directory-controls';

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
  const controls = useDirectoryControls();
  return (
    <Select
      value={`${controls?.field ?? sortField}-${controls?.field ? controls.direction : sortDirection}`}
      onValueChange={(value) => {
        const [field, direction] = value.split('-') as [SortField, SortDirection];
        onChange(field, direction);
        controls?.sort(field, direction);
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
        <SelectItem value="incomingMessageCount-desc">Больше сообщений</SelectItem>
        <SelectItem value="incomingMessageCount-asc">Меньше сообщений</SelectItem>
        <SelectItem value="buttonClickCount-desc">Больше нажатий</SelectItem>
        <SelectItem value="buttonClickCount-asc">Меньше нажатий</SelectItem>
        <SelectItem value="acquisitionSource-asc">Источник: меньше пользователей</SelectItem>
        <SelectItem value="acquisitionSource-desc">Источник: больше пользователей</SelectItem>
        <SelectItem value="variableCount-asc">Меньше переменных</SelectItem>
        <SelectItem value="variableCount-desc">Больше переменных</SelectItem>
        <SelectItem value="userStatus-asc">Статус А–Я</SelectItem>
        <SelectItem value="userStatus-desc">Статус Я–А</SelectItem>
        <SelectItem value="createdAt-desc">Сначала новые</SelectItem>
        <SelectItem value="createdAt-asc">Сначала старые</SelectItem>
        <SelectItem value="firstName-asc">Имя А-Я</SelectItem>
        <SelectItem value="firstName-desc">Имя Я-А</SelectItem>
      </SelectContent>
    </Select>
  );
}
