/** @fileoverview SQL счётчиков источников и Premium до пагинации и без собственного фильтра. */
/**
 * Считает людей каждого источника в уже выбранной области остальных фильтров.
 * @param selection - Доверенный SQL полного списка.
 * @returns Строки с названием источника и количеством людей.
 */
export function userSourceCountsSql(selection: string): string {
  return `SELECT "acquisitionSource" AS source,COUNT(*)::integer AS count FROM (${selection}) matched
    GROUP BY "acquisitionSource" ORDER BY "acquisitionSource"`;
}
/**
 * Считает Premium и обычные аккаунты без ограничения выбранным Premium.
 * @param selection - Доверенный SQL полного списка.
 * @returns Счётчики всех, Premium и обычных пользователей.
 */
export function userPremiumCountsSql(selection: string): string {
  return `SELECT COUNT(*)::integer AS "all",COUNT(*) FILTER(WHERE "isPremium")::integer AS "true",
    COUNT(*) FILTER(WHERE NOT "isPremium")::integer AS "false" FROM (${selection}) matched`;
}
/**
 * Считает людей по языкам, сохраняя отдельный вариант для отсутствующих данных.
 * @param selection - Полный список без ограничения выбранным языком.
 * @returns Коды языков и количества пользователей.
 */
export function userLanguageCountsSql(selection: string): string {
  return `SELECT COALESCE(NULLIF(LOWER(BTRIM("languageCode")),''),'__unknown__') AS language,
    COUNT(*)::integer AS count FROM (${selection}) matched GROUP BY 1 ORDER BY 1`;
}
