/** @fileoverview Запасные подписи источника для фильтров, счётчиков и связей с ботами. */
/**
 * Читает сохранённые реквизиты контакта при отсутствии аналитического источника.
 * @param alias - Статический псевдоним строки пользователя.
 * @returns SQL с теми же подписями, что в интерфейсе.
 */
export function userSourceFallbackSql(alias: 'u' | 'b'): string {
  return `CASE WHEN NULLIF(btrim(${alias}.deep_link_param),'') IS NOT NULL AND btrim(${alias}.deep_link_param)<>'direct'
    THEN 'Ссылка · '||btrim(${alias}.deep_link_param)
    WHEN NULLIF(btrim(${alias}.referrer_id::text),'') IS NOT NULL THEN 'Приглашение · '||btrim(${alias}.referrer_id::text)
    ELSE 'Источник не сохранён' END`;
}
