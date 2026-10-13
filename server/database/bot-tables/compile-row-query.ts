/**
 * @fileoverview Параметризованный фильтр строк без произвольного SQL
 * @module server/database/bot-tables/compile-row-query
 */

/** Допустимый оператор сравнения */
export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "filled"
  | "empty"
  | "greater_than"
  | "less_than";

/** Одно условие */
export interface RowFilter {
  /** Идентификатор столбца */
  columnId: number;
  /** Оператор */
  operator: FilterOperator;
  /** Значение, если оператору оно нужно */
  value?: string;
}

/** Сортировка страницы */
export interface RowSort {
  /** Поле сортировки */
  kind: "id" | "row_index" | "column";
  /** Столбец, если kind = column */
  columnId?: number;
}

/** Готовый запрос страницы и подсчёта */
export interface CompiledRowQuery {
  /** SQL страницы */
  listSql: string;
  /** Параметры страницы */
  listValues: unknown[];
  /** SQL количества */
  countSql: string;
  /** Параметры количества */
  countValues: unknown[];
}

/**
 * Экранирует символы LIKE
 * @param value - Исходный текст
 * @returns Текст с экранированием
 */
function likeEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Собирает WHERE по белому списку операторов
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param filters - Условия
 * @param sort - Сортировка
 * @param limit - Предел
 * @param offset - Смещение
 * @returns Два запроса
 */
export function compileRowQuery(
  projectId: number,
  tableId: number,
  filters: RowFilter[],
  sort: RowSort,
  limit: number,
  offset: number,
): CompiledRowQuery {
  const values: unknown[] = [projectId, tableId];
  const clauses: string[] = [];
  for (const filter of filters) {
    values.push(String(filter.columnId));
    const cell = `COALESCE(r.data->>$${values.length}, '')`;
    clauses.push(compileFilter(cell, filter, values));
  }
  const where = clauses.length ? ` AND ${clauses.join(" AND ")}` : "";
  const from = `FROM bot_table_rows r
    JOIN bot_tables t ON t.id = r.table_id AND t.project_id = $1 AND t.id = $2
    WHERE 1=1${where}`;
  const countValues = [...values];
  let order = "r.row_index ASC, r.id ASC";
  if (sort.kind === "id") order = "r.id ASC";
  if (sort.kind === "column" && sort.columnId !== undefined) {
    values.push(String(sort.columnId));
    order = `r.data->>$${values.length} ASC NULLS LAST, r.id ASC`;
  }
  values.push(limit, offset);
  return {
    listSql: `SELECT r.id, r.table_id, r.row_index, r.data ${from} ORDER BY ${order} LIMIT $${values.length - 1} OFFSET $${values.length}`,
    listValues: values,
    countSql: `SELECT COUNT(*)::int AS total ${from}`,
    countValues,
  };
}

/**
 * Добавляет одно сравнение
 * @param cell - Выражение ячейки
 * @param filter - Условие
 * @param values - Накапливаемые параметры
 * @returns Фрагмент SQL
 */
function compileFilter(cell: string, filter: RowFilter, values: unknown[]): string {
  if (filter.operator === "filled") return `NULLIF(btrim(${cell}), '') IS NOT NULL`;
  if (filter.operator === "empty") return `NULLIF(btrim(${cell}), '') IS NULL`;
  if (filter.operator === "greater_than" || filter.operator === "less_than") {
    values.push(filter.value ?? "");
    const cmp = filter.operator === "greater_than" ? ">" : "<";
    const num = `CASE WHEN btrim(${cell}) ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN btrim(${cell})::float8 END`;
    return `${num} ${cmp} $${values.length}::float8`;
  }
  const raw = filter.value ?? "";
  if (filter.operator === "contains") values.push(`%${likeEscape(raw)}%`);
  else if (filter.operator === "starts_with") values.push(`${likeEscape(raw)}%`);
  else if (filter.operator === "ends_with") values.push(`%${likeEscape(raw)}`);
  else values.push(raw);
  const placeholder = `$${values.length}`;
  if (filter.operator === "not_equals") return `${cell} IS DISTINCT FROM ${placeholder}`;
  if (filter.operator === "equals") return `${cell} = ${placeholder}`;
  return `${cell} ILIKE ${placeholder} ESCAPE '\\'`;
}
