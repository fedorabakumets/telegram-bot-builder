/**
 * @fileoverview Предупреждение для узла psql_query, у которого выбрано
 * встроенное подключение к БД платформы, отключённое администратором
 * @module components/editor/properties/components/configuration/psql-builtin-disabled-notice
 */

import { ShieldAlert } from 'lucide-react';

/**
 * Показывает, что режим builtin недоступен и запрос выполняться не будет,
 * пока пользователь не выберет своё подключение
 * @returns JSX элемент предупреждения
 */
export function PsqlBuiltinDisabledNotice() {
  return (
    <div className="flex gap-2 p-2 rounded-md text-[11px] leading-snug bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50">
      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>
        Подключение к базе платформы отключено администратором. Узел не будет выполнять запрос —
        выберите переменную бота со своим <code className="font-mono">postgresql://…</code> или
        введите адрес своей базы вручную.
      </span>
    </div>
  );
}
