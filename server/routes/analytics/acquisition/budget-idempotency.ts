/** @fileoverview Постоянная защита от повторной записи бюджета в транзакции проекта. */
import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { AcquisitionError } from './validation';
import { linkBudgetInput, saveLinkBudget } from './link-budget';
/**
 * Сохраняет бюджет либо возвращает прежнюю квитанцию того же запроса.
 * Вызывается внутри runRequest с блокировкой revision проекта; запись квитанции и расходов коммитятся вместе.
 * @param client - Соединение с активной транзакцией и блокировкой проекта.
 * @param projectId - Проект после проверки доступа.
 * @param body - Поля бюджета и необязательный requestId для старых HTTP-клиентов.
 * @param actor - Автор изменения.
 * @returns Сохранённый расход без повторной оплаты.
 */
export async function saveIdempotentLinkBudget(client: PoolClient, projectId: number, body: unknown, actor: string | null): Promise<unknown> {
  const { requestId, ...input } = linkBudgetInput.parse(body);
  if (!requestId) return saveLinkBudget(client, projectId, input, actor);
  const hash = createHash('sha256').update(JSON.stringify(input, Object.keys(input).sort())).digest('hex');
  const prior = await client.query('SELECT request_hash, response FROM analytics_budget_requests WHERE project_id=$1 AND request_id=$2 FOR UPDATE', [projectId, requestId]);
  if (prior.rows[0]) {
    if (prior.rows[0].request_hash !== hash) throw new AcquisitionError('requestId уже использован для другого бюджета', 409);
    return prior.rows[0].response;
  }
  const saved = await saveLinkBudget(client, projectId, input, actor);
  const result = { ...saved, requestId };
  await client.query('INSERT INTO analytics_budget_requests(project_id,request_id,request_hash,response) VALUES($1,$2,$3,$4::jsonb)', [projectId, requestId, hash, JSON.stringify(result)]);
  return result;
}
