/** @fileoverview Счётчики заполненности переменных без ограничения текущей переменной. */
/**
 * Считает каждую переменную один раз на человека; отсутствие учитывается через общее число людей.
 * @param selection - Полный список после остальных фильтров, до пагинации.
 * @param valueParameter - Параметр PostgreSQL точного значения для сравнения.
 * @returns Доверенный SQL без подстановки пользовательских имён и значений.
 */
export function userVariableCountsSql(selection: string, valueParameter: number): string {
  return `SELECT v.key AS name,
    COUNT(*) FILTER(WHERE NULLIF(BTRIM(v.value #>> '{}'),'') IS NOT NULL)::integer AS filled,
    COUNT(*) FILTER(WHERE v.value #>> '{}'=$${valueParameter}::text)::integer AS "equals"
    FROM (${selection}) matched CROSS JOIN LATERAL jsonb_each(
      CASE WHEN jsonb_typeof("userData")='object' THEN "userData" ELSE '{}'::jsonb END) v
    WHERE LENGTH(v.key) BETWEEN 1 AND 200 GROUP BY v.key ORDER BY LOWER(v.key),v.key`;
}
/**
 * Группирует значения выбранной переменной по людям, включая пустую строку.
 * @param selection - Список без собственного условия переменной.
 * @param nameParameter - Параметр точного имени переменной.
 * @param searchParameter - Параметр безопасного шаблона поиска значений.
 * @returns До 201 строки для определения наличия дополнительных значений.
 */
export function userVariableValuesSql(selection: string, nameParameter: number, searchParameter: number): string {
  const value = `("userData"->>$${nameParameter}::text)`;
  return `SELECT ${value} AS value,COUNT(*)::integer AS count FROM (${selection}) matched
    WHERE ${value} IS NOT NULL AND LENGTH(${value})<=2000 AND ${value} ILIKE $${searchParameter}::text
    GROUP BY ${value} ORDER BY count DESC,value LIMIT 201`;
}
