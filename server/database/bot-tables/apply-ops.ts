/**
 * @fileoverview Атомарный пакет операций над одной таблицей
 * @module server/database/bot-tables/apply-ops
 */

import { runTableOp } from "./apply-one-op";
import { SQL_TIMEOUT } from "./limits";
import type { MutateFail } from "./mutate-table";
import type { Queryable } from "./queryable";
import type { TableOp } from "./table-ops";

/** Успех пакета */
export interface ApplyOk {
  /** Признак успеха */
  ok: true;
  /** Результаты по порядку */
  results: unknown[];
  /** Имя таблицы для уведомления */
  tableName: string;
  /** Данные строк _content, которые нужно синхронизировать */
  contentRows: Record<string, string>[];
}

/** Откат пакета */
export interface ApplyFail extends MutateFail {
  /** Индекс операции, на которой остановились */
  failed_op_index: number;
}

/**
 * Выполняет пакет в одной транзакции
 * @param db - Клиент соединения
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param ops - Операции
 * @returns Результаты или индекс ошибки
 */
export async function applyTableOps(
  db: Queryable,
  projectId: number,
  tableId: number,
  ops: TableOp[],
): Promise<ApplyOk | ApplyFail> {
  await db.query("BEGIN");
  try {
    await db.query(`SET LOCAL statement_timeout = '${SQL_TIMEOUT}'`);
    const owned = await db.query<{ name: string }>(
      `SELECT name FROM bot_tables WHERE id = $1 AND project_id = $2`,
      [tableId, projectId],
    );
    if (!owned.rows[0]) {
      await db.query("ROLLBACK");
      return { ok: false, status: 404, message: "Таблица не найдена", failed_op_index: 0 };
    }
    const results: unknown[] = [];
    const contentRows: Record<string, string>[] = [];
    for (let index = 0; index < ops.length; index++) {
      const step = await runTableOp(db, projectId, tableId, ops[index]);
      if (isFail(step)) {
        await db.query("ROLLBACK");
        return {
          ok: false,
          status: "status" in step ? step.status : 400,
          message: step.message,
          failed_op_index: index,
        };
      }
      results.push(step);
      if (step && typeof step === "object" && "data" in step && owned.rows[0].name === "_content") {
        contentRows.push((step as { data: Record<string, string> }).data);
      }
      if (Array.isArray(step) && owned.rows[0].name === "_content") {
        for (const row of step) contentRows.push(row.data);
      }
    }
    await db.query("COMMIT");
    return { ok: true, results, tableName: owned.rows[0].name, contentRows };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

/**
 * Отличает отказ операции от полезного результата
 * @param step - Результат операции
 * @returns Признак отказа
 */
function isFail(step: unknown): step is { ok: false; message: string; status?: number } {
  return Boolean(step) && typeof step === "object" && "ok" in step && (step as { ok: boolean }).ok === false;
}
