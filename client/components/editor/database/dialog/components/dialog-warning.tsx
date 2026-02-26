/**
 * @fileoverview Компонент предупреждения о фиксации сообщений
 * Информирует о возможных потерях сообщений
 */

/**
 * Компонент предупреждения
 */
export function DialogWarning() {
  return (
    <div className="flex items-start gap-2 p-3 bg-amber-50/50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-800/40">
      <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400 text-sm mt-0.5 flex-shrink-0"></i>
      <div>
        <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
          Некоторые сообщения могут не фиксироваться
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
          Проверьте с помощью консоли логов для полной истории
        </p>
      </div>
    </div>
  );
}
