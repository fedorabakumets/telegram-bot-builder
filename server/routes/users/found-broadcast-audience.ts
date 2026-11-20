/** @fileoverview Лёгкий снимок ID и открытых реквизитов найденных людей без переменных и фасетов. */

/**
 * Выбирает ID, имена и username одним запросом из той же области, что список.
 * @param selection - Доверенная серверная выборка пользователей со всеми условиями
 * @returns SQL с ограничением, позволяющим обнаружить превышение лимита
 */
export function foundBroadcastAudienceSql(selection: string): string {
  return `SELECT DISTINCT audience."userId", audience."firstName", audience."lastName", audience."userName" FROM (${selection}) audience
    WHERE audience."lastMessageAt" IS NOT NULL
    ORDER BY audience."userId" LIMIT 10001`;
}
