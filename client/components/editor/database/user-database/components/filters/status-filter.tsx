/**
 * @fileoverview Компонент фильтра по статусу активности
 * @description Select для фильтрации пользователей по статусу (активен/неактивен)
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';

/**
 * Пропсы компонента StatusFilter
 */
interface StatusFilterProps {
  /** Текущее значение фильтра */
  value: string;
  /** Функция изменения значения */
  onChange: (value: string) => void;
}

/**
 * Компонент фильтра по статусу
 * @param props - Пропсы компонента
 * @returns JSX компонент фильтра
 */
export function StatusFilter({ value, onChange }: StatusFilterProps): React.JSX.Element {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="h-10 w-full min-w-0 rounded-lg border border-border/60 bg-background text-sm shadow-none transition-colors hover:bg-muted/40 [&>span]:truncate"
        aria-label="Статус активности"
        data-testid="select-status-filter"
      >
        <div className="flex min-w-0 items-center gap-2 [&>span]:truncate">
          <Activity className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="Статус" />
        </div>
      </SelectTrigger>
      <SelectContent className="users-portal">
        <SelectItem value="all">Все статусы</SelectItem>
        <SelectItem value="true">Активные</SelectItem>
        <SelectItem value="false">Неактивные</SelectItem>
      </SelectContent>
    </Select>
  );
}
