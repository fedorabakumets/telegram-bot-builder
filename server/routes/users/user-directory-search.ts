/** @fileoverview Общий поиск по реквизитам, источнику и сохранённым переменным пользователя. */
import { userSourceSql } from './user-directory-sql';
/**
 * Создаёт условие поиска с параметром PostgreSQL без подстановки пользовательского текста.
 * @param parameterIndex - Номер параметра с поисковой строкой.
 * @returns Условие для списка и счётчиков пользователей до пагинации.
 */
export function userDirectorySearchSql(parameterIndex: number): string {
  const parameter = `$${parameterIndex}`;
  return `(CONCAT_WS(' ',u.first_name,u.last_name) ILIKE ${parameter}
    OR u.username ILIKE ${parameter} OR ('@'||u.username) ILIKE ${parameter}
    OR u.user_id::text ILIKE ${parameter}
    OR ${userSourceSql} ILIKE ${parameter}
    OR u.user_data::text ILIKE ${parameter})`;
}
/**
 * Подготавливает поиск по буквальному фрагменту, включая подчёркивания в переменных.
 * @param search - Введённый пользователем текст.
 * @returns Шаблон частичного совпадения для параметра ILIKE.
 */
export function userDirectorySearchPattern(search: string): string {
  return `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`;
}
