/** @fileoverview Серверные ограничения аудитории с параметризованными значениями до пагинации. */
import { userContactOriginSql } from './user-contact-origin-sql';
import type { AdvancedUserFilters } from '@shared/user-advanced-filters';
import { userActionCountSql } from './user-directory-sql';
import { userContactEligibility } from './user-contact-eligibility';
import { userMessagePeriodSql } from './user-message-period-sql';
/**
 * Создаёт условие языка с собственной нумерацией параметров для независимых счётчиков.
 * @param language - Код языка либо отсутствие данных.
 * @param params - Параметры выбранной области.
 * @returns Условие языка либо пустая строка.
 */
export function userLanguageCondition(language: string | undefined, params: unknown[]): string {
  if (!language) return '';
  if (language === '__unknown__') return `NULLIF(BTRIM(u.language_code),'') IS NULL`;
  params.push(language);
  return `LOWER(BTRIM(u.language_code))=$${params.length}`;
}
/**
 * Создаёт условия для списка и всех счётчиков, дополняя общий массив параметров.
 * @param filters - Проверенные параметры.
 * @param params - Параметры проекта, бота и поиска.
 * @param messageSearch - Поисковая фраза диалогов для того же периода сообщений.
 * @returns Совместимые условия WHERE для записи u.
 */
export function advancedUserWhere(filters: AdvancedUserFilters, params: unknown[], messageSearch?: string): string[] {
  const conditions: string[] = [];
  const messagePeriod = userMessagePeriodSql(filters, params, messageSearch);
  if (messagePeriod) conditions.push(messagePeriod);
  /** Добавляет значение без включения пользовательского текста в SQL. */
  const bind = (value: unknown) => { params.push(value); return `$${params.length}`; };
  if (filters.contactOrigin) conditions.push(`${userContactOriginSql('u',true)}=${bind(filters.contactOrigin)}`);
  const now = `(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`;
  const dayStart = `(((CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow')::date::timestamp AT TIME ZONE 'Europe/Moscow') AT TIME ZONE 'UTC')`;
  if (filters.activity === 'today') conditions.push(`u.last_interaction>=${dayStart}`);
  if (filters.activity === '7d' || filters.activity === '30d')
    conditions.push(`u.last_interaction>=${now}-INTERVAL '${filters.activity === '7d' ? 7 : 30} days'`);
  if (filters.activity === 'older30') conditions.push(`(u.last_interaction IS NULL OR u.last_interaction<${now}-INTERVAL '30 days')`);
  /** Границы дат включают весь последний день в часовом поясе панели. */
  if (filters.lastActiveFrom) conditions.push(`u.last_interaction>=(${bind(filters.lastActiveFrom)}::date::timestamp AT TIME ZONE 'Europe/Moscow') AT TIME ZONE 'UTC'`);
  if (filters.lastActiveTo) conditions.push(`u.last_interaction<(((${bind(filters.lastActiveTo)}::date+1)::timestamp) AT TIME ZONE 'Europe/Moscow') AT TIME ZONE 'UTC'`);
  if (filters.registeredFrom) conditions.push(`u.registered_at>=(${bind(filters.registeredFrom)}::date::timestamp AT TIME ZONE 'Europe/Moscow') AT TIME ZONE 'UTC'`);
  if (filters.registeredTo) conditions.push(`u.registered_at<(((${bind(filters.registeredTo)}::date+1)::timestamp) AT TIME ZONE 'Europe/Moscow') AT TIME ZONE 'UTC'`);
  if (filters.language) conditions.push(userLanguageCondition(filters.language, params));
  if (filters.variableName) {
    const value = `(u.user_data->>${bind(filters.variableName)})`;
    const filled = `NULLIF(BTRIM(COALESCE(${value},'')),'')`;
    conditions.push(filters.variableMode === 'equals' ? `${value}=${bind(filters.variableValue ?? '')}`
      : `${filled} IS ${filters.variableMode === 'empty' ? '' : 'NOT '}NULL`);
  }
  for (const [min, max, clicks] of [[filters.messagesMin, filters.messagesMax, false],
    [filters.clicksMin, filters.clicksMax, true]] as const) {
    if (min !== undefined) conditions.push(`${userActionCountSql(clicks)}>=${bind(Number(min))}`);
    if (max !== undefined) conditions.push(`${userActionCountSql(clicks)}<=${bind(Number(max))}`);
  }
  if (filters.bots && params[1] == null) conditions.push(`(SELECT COUNT(DISTINCT ub.token_id) FROM bot_users ub
    WHERE ub.project_id=$1 AND ub.user_id=u.user_id AND ub.is_bot=0
    AND ${userContactEligibility('ub')})${filters.bots === 'one' ? '=1' : '>1'}`);
  return conditions;
}
