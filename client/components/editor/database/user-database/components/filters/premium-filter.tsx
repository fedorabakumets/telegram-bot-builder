/**
 * @fileoverview Компонент фильтра по Premium статусу
 * @description Select для фильтрации пользователей по Premium (есть/нет)
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown } from 'lucide-react';

/**
 * Пропсы компонента PremiumFilter
 */
interface PremiumFilterProps {
  /** Текущее значение фильтра */
  value: string;
  /** Функция изменения значения */
  onChange: (value: string) => void;
}

/**
 * Компонент фильтра по Premium
 * @param props - Пропсы компонента
 * @returns JSX компонент фильтра
 */
export function PremiumFilter({ value, onChange }: PremiumFilterProps): React.JSX.Element {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="h-10 sm:h-11 text-sm rounded-xl border-2 border-transparent bg-background shadow-sm hover:border-primary/20 transition-all"
        data-testid="select-premium-filter"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <SelectValue placeholder="Premium" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все пользователи</SelectItem>
        <SelectItem value="true">Только Premium</SelectItem>
        <SelectItem value="false">Обычные</SelectItem>
      </SelectContent>
    </Select>
  );
}
