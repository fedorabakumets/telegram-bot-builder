/**
 * @fileoverview Файловый импорт и экспорт таблиц только для локального stdio
 * @module lib/bot-tools/bot-tables-files
 */

import fs from 'fs';
import {
  buildAllTablesExport,
  parseAllTablesExport,
  parseCsv,
  parseJsonTable,
  tableToCsv,
  tableToJson,
  tableToJsonl,
  type ExportedTable,
  type IoColumn,
  type IoRow,
} from '../../shared/tables/io/index.ts';
import { isTableError, tableRequest, type TableHttpOptions } from './bot-tables-http.ts';
import { getTable, listTables, queryRows } from './bot-tables-read.ts';
import { clearRows, importRows } from './bot-tables-write.ts';
import { createPrivateExportDir, resolveTableReadPath, writePrivateFile } from './bot-tables-paths.ts';

/** Строка ответа API */
interface ApiRow {
  /** Идентификатор */
  id: number;
  /** Индекс */
  rowIndex: number;
  /** Ячейки */
  data: Record<string, string>;
}

/** Столбец ответа API */
interface ApiColumn {
  /** Идентификатор */
  id: number;
  /** Имя */
  name: string;
  /** Позиция */
  position: number;
}

/**
 * Импортирует CSV или JSON одной таблицы из разрешённого файла
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param filePath - Путь
 * @param mode - append или replace
 * @param confirm - Подтверждение замены
 * @param options - URL API
 * @returns Сколько строк записано или ошибка
 */
export async function importTableFile(
  projectId: number,
  tableId: number,
  filePath: string,
  mode: 'append' | 'replace',
  confirm: boolean | undefined,
  options?: TableHttpOptions,
) {
  if (mode === 'replace' && confirm !== true) return { error: 'Замена строк необратима. Передайте confirm: true.' };
  const resolved = resolveTableReadPath(filePath);
  if (typeof resolved !== 'string') return resolved;
  const table = await getTable(projectId, tableId, options);
  if (isTableError(table)) return table;
  const columns = (table as { columns: ApiColumn[] }).columns ?? [];
  const parsed = parseTableFile(resolved, columns);
  if ('error' in parsed) return parsed;
  if (parsed.length === 0) {
    if (mode === 'replace') return clearRows(projectId, tableId, { ...options, confirm: true });
    return { ok: true, rows: 0 };
  }
  let written = 0;
  for (let offset = 0; offset < parsed.length; offset += 200) {
    const chunk = parsed.slice(offset, offset + 200);
    const chunkMode = offset === 0 ? mode : 'append';
    const saved = await importRows(projectId, tableId, chunkMode, chunk, { ...options, confirm: confirm === true });
    if (isTableError(saved)) return saved;
    written += chunk.length;
  }
  return { ok: true, rows: written };
}

/**
 * Выгружает одну таблицу во временный каталог
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param format - csv, json или jsonl
 * @param options - URL API
 * @returns Путь файла или ошибка
 */
export async function exportTableFile(
  projectId: number,
  tableId: number,
  format: 'csv' | 'json' | 'jsonl',
  options?: TableHttpOptions,
) {
  const loaded = await loadWholeTable(projectId, tableId, options);
  if (isTableError(loaded)) return loaded;
  const text = format === 'csv'
    ? tableToCsv(loaded.columns, loaded.rows)
    : format === 'jsonl'
      ? tableToJsonl(loaded.columns, loaded.rows)
      : tableToJson(loaded.columns, loaded.rows);
  const dir = createPrivateExportDir();
  const target = writePrivateFile(dir, `table-${tableId}.${format}`, text);
  return { path: target, bytes: Buffer.byteLength(text), rows: loaded.rows.length };
}

/**
 * Выгружает все таблицы проекта
 * @param projectId - Проект
 * @param format - json или jsonl
 * @param options - URL API
 * @returns Путь файла или ошибка
 */
export async function exportProjectTables(projectId: number, format: 'json' | 'jsonl', options?: TableHttpOptions) {
  const tables = await listTables(projectId, options);
  if (isTableError(tables) || !Array.isArray(tables)) return isTableError(tables) ? tables : { error: 'Некорректный список' };
  const exported: ExportedTable[] = [];
  for (const table of tables as Array<{ id: number; name: string }>) {
    const loaded = await loadWholeTable(projectId, table.id, options);
    if (isTableError(loaded)) return loaded;
    exported.push({
      name: table.name,
      columns: loaded.columns.map((column) => column.name),
      rows: loaded.rows.map((row) => loaded.columns.map((column) => row.cells[column.id] ?? '')),
    });
  }
  const text = format === 'jsonl'
    ? exported.map((table) => JSON.stringify(table)).join('\n')
    : JSON.stringify(buildAllTablesExport(exported, new Date().toISOString()), null, 2);
  const dir = createPrivateExportDir();
  const target = writePrivateFile(dir, `project-${projectId}-tables.${format === 'jsonl' ? 'jsonl' : 'json'}`, text);
  return { path: target, bytes: Buffer.byteLength(text), tables: exported.length };
}

/**
 * Показывает превью файла версии 1 и при подтверждении заменяет или создаёт таблицы
 * @param projectId - Проект
 * @param filePath - Путь
 * @param mode - create или replace
 * @param confirm - Подтверждение замены
 * @param options - URL API
 * @returns Превью или результат записи
 */
export async function importProjectTables(
  projectId: number,
  filePath: string,
  mode: 'create' | 'replace',
  confirm: boolean | undefined,
  options?: TableHttpOptions,
) {
  const resolved = resolveTableReadPath(filePath);
  if (typeof resolved !== 'string') return resolved;
  let parsed: { tables: ExportedTable[] };
  try {
    parsed = parseAllTablesExport(fs.readFileSync(resolved, 'utf8'));
  } catch (error) {
    return { error: (error as Error).message };
  }
  const preview = parsed.tables.map((table) => ({
    name: table.name,
    columns: table.columns.length,
    rows: table.rows.length,
  }));
  if (mode === 'replace' && confirm !== true) return { preview, needs_confirm: true };
  if (confirm !== true && mode === 'create') return { preview, needs_confirm: true };
  const saved = await tableRequest(`/api/projects/${projectId}/tables/import`, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, confirm: true, tables: parsed.tables }),
  });
  if (isTableError(saved)) return saved;
  return { preview, result: saved };
}

/**
 * Читает все страницы таблицы
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param options - URL API
 * @returns Столбцы и строки или ошибка
 */
async function loadWholeTable(projectId: number, tableId: number, options?: TableHttpOptions) {
  const table = await getTable(projectId, tableId, options);
  if (isTableError(table)) return table;
  const columns: IoColumn[] = ((table as { columns: ApiColumn[] }).columns ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((column) => ({ id: String(column.id), name: column.name }));
  const rows: IoRow[] = [];
  let offset = 0;
  for (;;) {
    const page = await queryRows(projectId, tableId, { limit: 500, offset, sort: 'row_index' }, options);
    if (isTableError(page)) return page;
    const chunk = (page as { rows: ApiRow[] }).rows ?? [];
    rows.push(...chunk.map((row) => ({ cells: row.data })));
    if (chunk.length < 500) break;
    offset += 500;
  }
  return { columns, rows };
}

/**
 * Переводит файл в ячейки по идентификаторам столбцов
 * @param filePath - Уже проверенный путь
 * @param columns - Схема таблицы
 * @returns Строки или ошибка
 */
function parseTableFile(filePath: string, columns: ApiColumn[]): Array<Record<string, string>> | { error: string } {
  const text = fs.readFileSync(filePath, 'utf8');
  let grid: { columns: string[]; rows: string[][] };
  try {
    grid = filePath.toLowerCase().endsWith('.json') ? parseJsonTable(text) : parseCsv(text);
  } catch (error) {
    return { error: (error as Error).message };
  }
  const byName = new Map(columns.map((column) => [column.name, String(column.id)]));
  for (const name of grid.columns) {
    if (!byName.has(name)) return { error: `В таблице нет столбца «${name}»` };
  }
  return grid.rows.map((row) => {
    const data: Record<string, string> = {};
    grid.columns.forEach((name, index) => {
      data[byName.get(name)!] = row[index] ?? '';
    });
    return data;
  });
}
