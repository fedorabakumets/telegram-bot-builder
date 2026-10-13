/**
 * @fileoverview Пакет операций в одной транзакции
 * @module routes/tables/handlers/applyOpsHandler
 */

import type { Request, Response } from "express";
import { applyTableOps } from "../../../database/bot-tables/apply-ops";
import { opsNeedConfirm, parseTableOps } from "../../../database/bot-tables/table-ops";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { withClient } from "../table-db";

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/apply-ops
 * @param req - Запрос
 * @param res - Ответ
 */
export async function applyOpsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const ops = parseTableOps(req.body?.ops);
    if ("message" in ops) {
      fail(res, 400, ops.message);
      return;
    }
    if (opsNeedConfirm(ops) && req.body?.confirm !== true) {
      fail(res, 400, "Пакет содержит удаление. Передайте confirm: true");
      return;
    }
    const applied = await withClient((db) => applyTableOps(db, owned.projectId, owned.table.id, ops));
    if (!applied.ok) {
      res.status(applied.status).json({ message: applied.message, failed_op_index: applied.failed_op_index });
      return;
    }
    res.json({ results: applied.results });
    await notifyTableChange(owned.projectId, owned.table.id, applied.tableName, applied.contentRows);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
