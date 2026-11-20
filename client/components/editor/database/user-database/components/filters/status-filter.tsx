/**
 * @fileoverview Фильтр состояния пользователя с учётом активности, блокировки и удаления.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';
import { statusAppearance } from '@shared/status-appearance';
import { NO_AVAILABLE_BOTS_LABEL } from '@shared/bot-availability-label';
import { useDirectoryControls } from '../../content/user-directory-controls';

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
  const controls = useDirectoryControls();
  /** Повторяет цвета таблицы и добавляет количество без подмены неизвестного значения нулём. */
  function label(text: string, status: 'all' | 'active' | 'inactive' | 'blocked' | 'deleted' | 'botUnavailable' | 'unverified'): React.ReactNode {
    if (!controls) return text;
    const count = controls.result?.statusCounts?.[status];
    const color = status === 'all' ? undefined : statusAppearance(text).color;
    return <span style={{ color }}>{text} · {count == null ? '—' : count.toLocaleString('ru-RU')}</span>;
  }
  return (
    <Select value={controls?.status ?? value} onValueChange={next => {
      /** Убирает старый фильтр активности, чтобы он не исключал заблокированные аккаунты. */
      if (controls) { controls.setStatus(next); onChange('all'); }
      else onChange(next);
    }}>
      <SelectTrigger
        className="h-10 w-full min-w-0 rounded-lg border border-border/60 bg-background text-sm shadow-none transition-colors hover:bg-muted/40 [&>span]:truncate"
        aria-label="Статус пользователя"
        data-testid="select-status-filter"
      >
        <div className="flex min-w-0 items-center gap-2 [&>span]:truncate">
          <Activity className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <SelectValue placeholder="Статус" />
        </div>
      </SelectTrigger>
      <SelectContent className="users-portal users-status-menu">
        <SelectItem value="all">{label('Все статусы', 'all')}</SelectItem>
        <SelectItem value={controls ? 'active' : 'true'}>{label('Активные', 'active')}</SelectItem>
        {controls && <SelectItem value="unverified">{label('Не проверен', 'unverified')}</SelectItem>}
        {controls && <SelectItem value="blocked">{label('Пользователь заблокировал бота', 'blocked')}</SelectItem>}
        {/** Общий статус означает отсутствие доступного бота среди всех связей человека. */}
        {controls && <SelectItem value="botUnavailable">{label(NO_AVAILABLE_BOTS_LABEL, 'botUnavailable')}</SelectItem>}
        {controls && <SelectItem value="deleted">{label('Аккаунт удалён', 'deleted')}</SelectItem>}
      </SelectContent>
    </Select>
  );
}
