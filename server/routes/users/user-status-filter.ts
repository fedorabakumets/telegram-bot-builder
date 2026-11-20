/** @fileoverview Условия статуса пользователей, совпадающие с приоритетом состояний в таблице. */
import { userBotUnavailableSql } from './user-bot-unavailable-sql';
import { unverifiedContactSql } from './user-contact-eligibility';
/** Разрешённые статусы без пользовательских SQL-фрагментов. */
const predicates: Record<string, string> = {
  active: `COALESCE(u.is_deleted,0)=0 AND NOT (${userBotUnavailableSql()}) AND NOT (${unverifiedContactSql()}) AND COALESCE(u.is_blocked,0)=0 AND u.is_active=1`,
  inactive: `COALESCE(u.is_deleted,0)=0 AND NOT (${userBotUnavailableSql()}) AND NOT (${unverifiedContactSql()}) AND COALESCE(u.is_blocked,0)=0 AND COALESCE(u.is_active,0)<>1`,
  blocked: `COALESCE(u.is_deleted,0)=0 AND NOT (${userBotUnavailableSql()}) AND NOT (${unverifiedContactSql()}) AND u.is_blocked=1`,
  unverified: `COALESCE(u.is_deleted,0)=0 AND NOT (${userBotUnavailableSql()}) AND ${unverifiedContactSql()}`,
  deleted: 'u.is_deleted=1',
  botUnavailable: `COALESCE(u.is_deleted,0)=0 AND (${userBotUnavailableSql()})`,
};
/**
 * Возвращает статическое условие статуса с приоритетом удаления и блокировки.
 * @param status - Проверяемое значение фильтра.
 * @returns SQL-условие либо отсутствие допустимого статуса.
 */
export function userStatusPredicate(status: string): string | undefined {
  return Object.hasOwn(predicates, status) ? predicates[status] : undefined;
}
