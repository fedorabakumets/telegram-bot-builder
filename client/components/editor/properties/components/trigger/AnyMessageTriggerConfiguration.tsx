/**
 * @fileoverview Панель свойств узла триггера входящего сообщения
 *
 * Минималистичная панель без настроек — узел срабатывает
 * на каждое входящее сообщение без дополнительной конфигурации.
 * @module properties/components/trigger/AnyMessageTriggerConfiguration
 */

/** Панель свойств триггера входящего сообщения */
export function AnyMessageTriggerConfiguration() {
  return (
    <div className="rounded-xl bg-green-50/60 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/40 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <i className="fas fa-inbox text-green-600 dark:text-green-400 text-sm" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          Триггер входящего сообщения
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Срабатывает на каждое входящее сообщение от пользователя боту.
        Используется как fallback-обработчик, когда ни один другой триггер не подошёл.
      </p>
    </div>
  );
}
