/**
 * @fileoverview Компактный переключатель статуса базы данных
 * @description Отображается как маленький бейдж со свитчем: "✅ Включена" / "❌ Выключена"
 */

import { Switch } from '@/components/ui/switch';

/**
 * Пропсы компонента DatabaseToggle
 */
interface DatabaseToggleProps {
  /** Флаг включена ли БД */
  isDatabaseEnabled: boolean;
  /** Функция переключения */
  onToggle: (checked: boolean) => void;
  /** Флаг загрузки */
  isPending: boolean;
}

/**
 * Компактный бейдж-переключатель базы данных
 * @param props - Пропсы компонента
 * @returns JSX компонент переключателя
 */
export function DatabaseToggle({
  isDatabaseEnabled,
  onToggle,
  isPending,
}: DatabaseToggleProps): React.JSX.Element {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground"
      data-testid="database-toggle-container"
    >
      <span className="whitespace-nowrap">{isDatabaseEnabled ? 'Включена' : 'Выключена'}</span>
      <Switch
        id="db-toggle"
        aria-label="Сохранение данных пользователей"
        data-testid="switch-database-toggle"
        checked={isDatabaseEnabled}
        onCheckedChange={onToggle}
        disabled={isPending}
        className="scale-75 origin-right"
      />
    </div>
  );
}
