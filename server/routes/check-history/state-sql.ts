/** @fileoverview Читаемое состояние потерянного worker без изменения сохранённой истории. */
/** Строит безопасные выражения для заранее заданного псевдонима таблицы. @param alias - Внутренний псевдоним SQL. @param interruptedReason - Код потерянного worker. @returns Выражения нормализации. */
export function historyStateSql(alias: 'j' | 'b' | 'r', interruptedReason = 'worker_interrupted') {
  const expired = `${alias}.status IN ('pending','running','cancelling') AND COALESCE(${alias}.lease_until,${alias}.created_at+interval '2 minutes')<now()`;
  return {
    /** Итог потерянной задачи вместо бесконечного выполнения. */
    status: `CASE WHEN ${expired} THEN 'failed' ELSE ${alias}.status END`,
    /** Стабильное время истечения аренды вместо времени чтения истории. */
    finished: `CASE WHEN ${expired} THEN COALESCE(${alias}.lease_until,${alias}.created_at+interval '2 minutes') ELSE ${alias}.finished_at END`,
    /** Причина прерывания не выдаётся за отказ Telegram. */
    reason: `CASE WHEN ${expired} THEN '${interruptedReason}' ELSE ${alias}.failure_reason END`,
  };
}
