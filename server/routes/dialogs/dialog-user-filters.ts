/** @fileoverview Общие правила применения профильных фильтров только к личным диалогам. */
import { userSourceSql } from '../users/user-directory-sql';
import { userBotUnavailableSql, userHasOtherBotsSql } from '../users/user-bot-unavailable-sql';
import { hasPrivateMessagesSql } from '../users/user-contact-eligibility';
/**
 * Определяет, сужает ли запрос личные профили, не считая пустую настройку фильтром.
 * @param query - Параметры запроса после выбора области диалогов.
 * @returns Признак исключения групп из режима «Все».
 */
export function hasDialogProfileConstraints(query: Record<string, unknown>): boolean {
  if (typeof query.source === 'string' && query.source.length > 0) return true;
  if (typeof query.status === 'string' && query.status !== '' && query.status !== 'all') return true;
  if (query.premium === 'true' || query.premium === 'false' || query.filterActive === 'true' || query.filterActive === 'false') return true;
  if (query.filters === undefined) return false;
  try {
    const value = typeof query.filters === 'string' ? JSON.parse(query.filters) : query.filters;
    return value === null || typeof value !== 'object' || Object.values(value).some(item => item !== undefined && item !== null && item !== '');
  } catch { return true; }
}
/**
 * Добавляет признаки только в личную выборку фасетов, сохраняя исходную форму UNION диалогов.
 * @param selection - Доверенный SELECT личных диалогов с псевдонимом u.
 * @returns SQL для точных счётчиков источника, статуса, Premium и языка.
 */
export function dialogProfileFacetSelection(selection: string): string {
  return selection.replace(/^\s*SELECT\b/, `SELECT ${userSourceSql} AS "acquisitionSource",
    (${userBotUnavailableSql()}) AS "botUnavailable",${userHasOtherBotsSql()} AS "hasOtherAvailableBots",
    u.imported_at AS "importedAt",${hasPrivateMessagesSql()} AS "hasPrivateMessages",`);
}
/**
 * Использует дату сообщения диалога вместо даты последнего обновления профиля.
 * @param conditions - Условия общего конструктора фильтров пользователей.
 * @returns Условия с сохранёнными безопасными параметрами и семантикой диалогов.
 */
export function dialogActivityConditions(conditions: string[]): string[] {
  return conditions.map(condition => condition.replace(/\bu\.last_interaction\b/g, 'lm.created_at'));
}
