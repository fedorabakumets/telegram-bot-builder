/**
 * @fileoverview Загрузка таблицы только внутри проекта из URL
 * @module routes/tables/owned-table
 */

import type { Request, Response } from "express";
import { loadColumnsInProject, loadTableInProject } from "../../database/bot-tables/load-scope";
import type { ColumnRecord, TableRecord } from "../../database/bot-tables/map-records";
import { fail, positiveId } from "./http-error";
import { tablePool } from "./table-db";

/** Таблица и её столбцы */
export interface OwnedTable {
  /** Проект из URL */
  projectId: number;
  /** Таблица */
  table: TableRecord;
  /** Столбцы */
  columns: ColumnRecord[];
}

/**
 * Проверяет проект и таблицу. При ошибке ответ уже отправлен
 * @param req - Запрос
 * @param res - Ответ
 * @returns Таблица или undefined
 */
export async function ownedTable(req: Request, res: Response): Promise<OwnedTable | undefined> {
  const projectId = positiveId(req.params.id);
  const tableId = positiveId(req.params.tableId);
  if (projectId === null || tableId === null) {
    fail(res, 400, "Некорректный идентификатор");
    return;
  }
  const table = await loadTableInProject(tablePool, projectId, tableId);
  if (!table) {
    fail(res, 404, "Таблица не найдена");
    return;
  }
  const columns = await loadColumnsInProject(tablePool, projectId, tableId);
  return { projectId, table, columns };
}
