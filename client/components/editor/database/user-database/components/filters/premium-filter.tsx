/**
 * @fileoverview Компонент фильтра по Premium статусу
 * @description Select для фильтрации пользователей по Premium (есть/нет)
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown } from 'lucide-react';
import { useDirectoryControls } from '../../content/user-directory-controls';

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
  const controls = useDirectoryControls();
  /** Количества учитывают поиск, источник и статус, но не выбранный Premium. */
  function label(text: string, key: 'all' | 'true' | 'false') {
    const count = controls?.result?.premiumCounts?.[key];
    return `${text} · ${count === undefined ? '—' : count.toLocaleString('ru-RU')}`;
  }
  return (
    <Select value={value} onValueChange={next => { controls?.setPremium(next); onChange(next); }}>
      <SelectTrigger
        className="h-10 w-full min-w-0 rounded-lg border border-border/60 bg-background text-sm shadow-none transition-colors hover:bg-muted/40 [&>span]:truncate"
        aria-label="Telegram Premium"
        data-testid="select-premium-filter"
      >
        <div className="flex min-w-0 items-center gap-2 [&>span]:truncate">
          <Crown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="Все пользователи" />
        </div>
      </SelectTrigger>
      <SelectContent className="users-portal">
        <SelectItem value="all">{label('Все пользователи', 'all')}</SelectItem>
        <SelectItem value="true">{label('С Telegram Premium', 'true')}</SelectItem>
        <SelectItem value="false">{label('Без Telegram Premium', 'false')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
