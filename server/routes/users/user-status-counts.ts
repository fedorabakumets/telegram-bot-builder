/** @fileoverview Агрегаты состояний пользователей в общей области фильтров. */
/**
 * Подсчитывает статусы людей и независимую проблему их ботов.
 * @param selection - Доверенный SQL списка без фильтра статуса и пагинации.
 * @param includeBotAvailability - Выборка содержит признак недоступности бота.
 * @returns SQL одной строки со счётчиками.
 */
export function userStatusCountsSql(selection: string, includeBotAvailability = false): string {
  /** Ограничение бота заменяет непроверенный личный статус, но не признак удалённого аккаунта. */
  const accessible = includeBotAvailability ? ' AND NOT "botUnavailable"' : '';
  /** Только каталог пользователей содержит явные признаки импорта и подтверждённой переписки. */
  const verified = includeBotAvailability ? ' AND NOT ("importedAt" IS NOT NULL AND NOT "hasPrivateMessages")' : '';
  return `SELECT COUNT(*)::integer AS "all",
    COUNT(*) FILTER(WHERE NOT "isDeleted"${accessible}${verified} AND NOT "isBlocked" AND "isActive")::integer AS active,
    COUNT(*) FILTER(WHERE NOT "isDeleted"${accessible}${verified} AND NOT "isBlocked" AND NOT "isActive")::integer AS inactive,
    COUNT(*) FILTER(WHERE NOT "isDeleted"${accessible}${verified} AND "isBlocked")::integer AS blocked,
    COUNT(*) FILTER(WHERE "isDeleted")::integer AS deleted
    ${includeBotAvailability ? ', COUNT(*) FILTER(WHERE NOT "isDeleted" AND "botUnavailable")::integer AS "botUnavailable"' : ''}
    ${includeBotAvailability ? ', COUNT(*) FILTER(WHERE NOT "isDeleted" AND "hasOtherAvailableBots")::integer AS "otherAvailableBots"' : ''}
    ${includeBotAvailability ? ', COUNT(*) FILTER(WHERE NOT "isDeleted" AND NOT "botUnavailable" AND "importedAt" IS NOT NULL AND NOT "hasPrivateMessages")::integer AS unverified' : ''}
    FROM (${selection}) matched`;
}
