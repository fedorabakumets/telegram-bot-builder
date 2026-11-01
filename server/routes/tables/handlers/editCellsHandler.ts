/** @fileoverview Маршрут атомарного изменения диапазона ячеек. */
import type { Request, Response } from 'express';
import { tableCellBatchSchema } from '../../../../shared/table-cell-edit';
import { applyCellEdits, TableEditError } from '../../../database/bot-tables/apply-cell-edits';
import { ownedTable } from '../owned-table';
import { withClient } from '../table-db';
import { notifyTableChange } from '../notify-table-change';
import { fail, sqlFailure } from '../http-error';
/**
 * Проверяет запрос и сохраняет все ячейки одной операцией.
 * @param req - Запрос авторизованного пользователя.
 * @param res - Ответ с обновлёнными строками или конфликтом.
 * @returns Завершение запроса.
 */
export async function editCellsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res); if (!owned) return;
    const parsed = tableCellBatchSchema.safeParse(req.body);
    if (!parsed.success) { fail(res, 400, 'Проверьте ячейки: допустимо от 1 до 5000 изменений за операцию'); return; }
    const rows = await withClient((db) => applyCellEdits(db, owned.projectId, owned.table.id, parsed.data.edits));
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
    res.json({ rows });
  } catch (error) {
    const result = error instanceof TableEditError ? error : sqlFailure(error);
    fail(res, result.status, result.message);
  }
}
