/** @fileoverview Сохранение дневных расходов с точным и явным распределением оплаты. */
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { expenseInput, AcquisitionError } from './validation';
import { allocateExpense } from './money';
import { scopedRow } from './storage';
/** Создаёт записи оплаты, возвращая все дневные части. */
export async function createExpenses(client: PoolClient, projectId: number, body: unknown): Promise<Record<string, any>[]> {
  const input = expenseInput.parse(body);
  const placement = await scopedRow(client, 'placements', projectId, input.placementId);
  if (placement.archived_at) throw new AcquisitionError('Размещение находится в архиве');
  if (input.untilDay && input.untilDay !== input.day && input.allocation !== 'equal') throw new AcquisitionError('Подтвердите распределение оплаты по дням');
  const parts = allocateExpense(input.amount, input.day, input.allocation === 'equal' ? input.untilDay : input.day);
  const groupId = parts.length > 1 ? randomUUID() : null;
  const rows = [];
  for (const part of parts) {
    rows.push((await client.query(`INSERT INTO analytics_expenses(project_id,placement_id,amount,currency,day,exchange_rate_rub_per_usd,note,allocation_group_id,estimated,exchange_rate_date)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [projectId,input.placementId,part.amount,input.currency,part.day,input.exchangeRateRubPerUsd ?? null,input.note,groupId,parts.length > 1,input.exchangeRateRubPerUsd ? input.exchangeRateDate ?? input.day : null])).rows[0]);
  }
  return rows;
}
