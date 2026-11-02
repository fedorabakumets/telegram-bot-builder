/** @fileoverview Общая временная область физических событий и независимых свидетельств контакта. */
/**
 * Возвращает даты без смешивания свидетельств с физическими счётчиками.
 * @returns Подзапрос с областью проекта $1 и необязательного бота $2.
 */
export function v2HistoryTimesSql(): string {
  return `SELECT occurred_at FROM analytics_events_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)
    UNION ALL SELECT observed_at FROM analytics_audience_evidence_v2 WHERE project_id=$1 AND ($2::integer IS NULL OR token_id=$2)`;
}
