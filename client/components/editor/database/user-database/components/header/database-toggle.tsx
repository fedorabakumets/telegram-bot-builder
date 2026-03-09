/**
 * @fileoverview Компонент переключателя статуса базы данных
 * @description Позволяет включать/выключать базу данных пользователей
 */

import { Label } from '@/components/ui/label';
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
 * Компонент переключателя базы данных
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
      className={`flex items-center gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${
        isDatabaseEnabled
          ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 shadow-emerald-500/10 shadow-lg'
          : 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 shadow-rose-500/10 shadow-lg'
      }`}
      data-testid="database-toggle-container"
    >
      <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isDatabaseEnabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      <Label
        htmlFor="db-toggle"
        className={`text-sm font-semibold cursor-pointer whitespace-nowrap ${
          isDatabaseEnabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
        }`}
      >
        {isDatabaseEnabled ? 'Активна' : 'Отключена'}
      </Label>
      <Switch
        id="db-toggle"
        data-testid="switch-database-toggle"
        checked={isDatabaseEnabled}
        onCheckedChange={onToggle}
        disabled={isPending}
      />
    </div>
  );
}
