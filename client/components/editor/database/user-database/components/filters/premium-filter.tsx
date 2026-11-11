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
        className="h-10 w-full min-w-0 rounded-lg border border-border/60 bg-background text-sm shadow-none transition-colors hover:bg-muted/40 [&>span]:truncate"
        aria-label="Telegram Premium"
        data-testid="select-premium-filter"
      >
        <div className="flex min-w-0 items-center gap-2 [&>span]:truncate">
          <Crown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="Premium" />
        </div>
      </SelectTrigger>
      <SelectContent className="users-portal">
        <SelectItem value="all">Любой Premium</SelectItem>
        <SelectItem value="true">Только Premium</SelectItem>
        <SelectItem value="false">Без Premium</SelectItem>
      </SelectContent>
    </Select>
  );
}
