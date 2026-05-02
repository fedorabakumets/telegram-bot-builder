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
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-colors ${
        isDatabaseEnabled
          ? 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
          : 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30'
      }`}
      data-testid="database-toggle-container"
    >
      <span>{isDatabaseEnabled ? '✅' : '❌'}</span>
      <span className="whitespace-nowrap">{isDatabaseEnabled ? 'Включена' : 'Выключена'}</span>
      <Switch
        id="db-toggle"
        data-testid="switch-database-toggle"
        checked={isDatabaseEnabled}
        onCheckedChange={onToggle}
        disabled={isPending}
        className="scale-75 origin-right"
      />
    </div>
  );
}
