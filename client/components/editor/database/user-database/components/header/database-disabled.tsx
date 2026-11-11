/**
 * @fileoverview Спокойное штатное состояние отключённого сохранения пользователей.
 */

import { Database } from 'lucide-react';

/**
 * Объясняет поведение бота при отключённой базе пользователей.
 * @returns Панель с описанием отключённого сохранения.
 */
export function DatabaseDisabled(): React.JSX.Element {
  return (
    <section className="m-6 flex max-w-lg items-start gap-4 rounded-xl border border-border bg-muted/20 p-6" aria-labelledby="database-disabled-title">
      <Database className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-2">
        <h3 id="database-disabled-title" className="text-base font-medium">Сохранение пользователей выключено</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Бот продолжает работать, но новые данные пользователей не сохраняются. Включите базу данных в настройках проекта, чтобы собирать ответы и статистику.
        </p>
      </div>
    </section>
  );
}
