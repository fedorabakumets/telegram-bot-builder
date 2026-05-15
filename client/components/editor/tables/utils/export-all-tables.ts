/**
 * @fileoverview Экспорт всех таблиц проекта в единый JSON-файл
 * @module editor/tables/utils/export-all-tables
 */

import * as api from '../api/tables-api';
import { downloadFile } from './download-file';

/** Формат экспорта одной таблицы */
interface ExportedTable {
  /** Имя таблицы */
  name: string;
  /** Имена колонок по порядку */
  columns: string[];
  /** Строки данных (массив массивов значений) */
  rows: string[][];
}

/** Формат файла экспорта всех таблиц */
interface AllTablesExport {
  /** Версия формата */
  version: 1;
  /** Дата экспорта */
  exportedAt: string;
  /** Массив таблиц */
  tables: ExportedTable[];
}

/**
 * Экспортирует все таблицы проекта в один JSON-файл и скачивает его
 * @param projectId - ID проекта
 * @param projectName - Имя проекта (для имени файла)
 */
export async function exportAllTables(projectId: number, projectName?: string): Promise<void> {
  const tables = await api.fetchTables(projectId);

  const exported: ExportedTable[] = await Promise.all(
    tables.map(async (table) => {
      const columns = await api.fetchColumns(projectId, table.id);
      const rows = await api.fetchRows(projectId, table.id);

      /** Сортируем колонки по position */
      const sortedCols = [...columns].sort((a, b) => a.position - b.position);

      return {
        name: table.name,
        columns: sortedCols.map((c) => c.name),
        rows: rows.map((r) =>
          sortedCols.map((col) => (r.data as Record<string, string>)?.[String(col.id)] ?? ''),
        ),
      };
    }),
  );

  const payload: AllTablesExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: exported,
  };

  const fileName = projectName
    ? `${projectName}_tables_export.json`
    : `tables_export.json`;

  downloadFile(JSON.stringify(payload, null, 2), fileName, 'application/json');
}
