/**
 * @fileoverview SQL-выражение конечного числа в начале текста ячейки.
 */

/** Первое число в начале текста для regexp_match. */
const MATCH = '^([-+]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][-+]?[0-9]+)?)';

/**
 * Возвращает скаляр числа или NULL. Выражение должно быть фрагментом SQL, не текстом пользователя.
 * @param expr - SQL-выражение текста ячейки.
 * @returns Подзапрос double precision.
 */
export function tableNumberSql(expr: string): string {
  return `(SELECT CASE WHEN matched IS NULL THEN NULL
    WHEN matched ~ '^[-+]?[0-9]{1,12}([.][0-9]{0,8})?([eE][-+]?[0-9]{1,2})?$'
      OR matched ~ '^[-+]?[.][0-9]{1,8}([eE][-+]?[0-9]{1,2})?$'
    THEN matched::double precision ELSE NULL END
    FROM (SELECT (regexp_match(btrim(coalesce(${expr}, '')), '${MATCH}'))[1] AS matched) parsed)`;
}
