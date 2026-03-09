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
        className="h-10 sm:h-11 text-sm rounded-xl border-2 border-transparent bg-background shadow-sm hover:border-primary/20 transition-all"
        data-testid="select-status-filter"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <SelectValue placeholder="Статус" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все статусы</SelectItem>
        <SelectItem value="true">Активные</SelectItem>
        <SelectItem value="false">Неактивные</SelectItem>
      </SelectContent>
    </Select>
  );
}
