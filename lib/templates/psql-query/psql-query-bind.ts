/**
 * @fileoverview Разбор плейсхолдеров {имя} в SQL узла psql_query
 * @module templates/psql-query/psql-query-bind
 */

/** Результат перевода {имя} в параметры asyncpg */
export interface PsqlBoundQuery {
  /** Текст SQL, в котором плейсхолдеры заменены на $1, $2, ... */
  sql: string;
  /** Имена параметров в порядке первого вхождения, без повторов */
  names: string[];
}

/**
 * Буквы, цифры, подчёркивание (как Python `\w`), плюс точка и скобки индекса.
 * Совпадает с классом `[\w.\[\]]` в replace_variables_in_text.
 */
const PSQL_PLACEHOLDER = /'\{([\p{L}\p{N}_.\[\]]+)\}'|\{([\p{L}\p{N}_.\[\]]+)\}/gu;

/**
 * Переводит фигурные скобки в SQL в параметры asyncpg.
 * `'{имя}'` (кавычки вплотную) тоже становится параметром, кавычки снимаются.
 * Одинаковое имя занимает один номер. Запрос без скобок возвращается как есть.
 * @param query - Исходный SQL автора
 * @returns Текст с $n и список имён
 */
export function bindPsqlQuery(query: string): PsqlBoundQuery {
  const source = typeof query === "string" ? query : "";
  const names: string[] = [];
  const indexByName = new Map<string, number>();
  const pattern = new RegExp(PSQL_PLACEHOLDER.source, "gu");
  const sql = source.replace(pattern, (_full, quotedName: string | undefined, bareName: string | undefined) => {
    const name = quotedName ?? bareName ?? "";
    let number = indexByName.get(name);
    if (number === undefined) {
      number = names.length + 1;
      names.push(name);
      indexByName.set(name, number);
    }
    return `$${number}`;
  });
  return { sql, names };
}
