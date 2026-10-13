/**
 * @fileoverview Пакет операций: подтверждение до сети, если есть удаление
 * @module lib/bot-tools/bot-tables-batch
 */

import { tableRequest, type TableHttpOptions } from './bot-tables-http.ts';
import { MAX_TABLE_OPS } from './bot-tables-limits.ts';

/** Операция пакета в виде JSON инструмента */
export type TableToolOp = Record<string, unknown> & { op: string };

/**
 * Применяет пакет одной транзакцией на сервере
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param ops - Операции
 * @param confirm - Подтверждение удалений
 * @param options - URL API
 * @returns Результаты или ошибка
 */
export function applyTableOps(
  projectId: number,
  tableId: number,
  ops: TableToolOp[],
  confirm: boolean | undefined,
  options?: TableHttpOptions,
) {
  if (!Array.isArray(ops) || ops.length === 0 || ops.length > MAX_TABLE_OPS) {
    return Promise.resolve({ error: `Нужно от 1 до ${MAX_TABLE_OPS} операций` });
  }
  const destructive = ops.some((op) => op.op === 'delete_column' || op.op === 'delete_row');
  if (destructive && confirm !== true) {
    return Promise.resolve({ error: 'Пакет содержит удаление. Передайте confirm: true.' });
  }
  return tableRequest(`/api/projects/${projectId}/tables/${tableId}/apply-ops`, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: confirm === true, ops }),
  });
}
