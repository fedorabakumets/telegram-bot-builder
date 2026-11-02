/** @fileoverview Общие операции хранения рекламных сущностей и уведомления после commit. */
import type { PoolClient } from 'pg';
import { AcquisitionError } from './validation';
/** Разрешённые ресурсы API; имена таблиц не поступают из пользовательского SQL. */
export const RESOURCE_TABLES = { sources: 'analytics_sources', placements: 'analytics_placements', links: 'analytics_links', expenses: 'analytics_expenses' } as const;
/** Название ресурса из фиксированного перечня. */
export type AcquisitionResource = keyof typeof RESOURCE_TABLES;
/** Преобразует безопасную строку таблицы в camelCase DTO. */
export function acquisitionDto(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'bot_username').map(([key, value]) => [
    key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date
      ? ['day', 'starts_on', 'ends_on', 'exchange_rate_date'].includes(key)
        ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
        : value.toISOString() : value,
  ]));
}
/** Получает ресурс только внутри указанного проекта. */
export async function scopedRow(client: PoolClient, resource: AcquisitionResource, projectId: number, resourceId: number, lock = false) {
  const result = await client.query(`SELECT * FROM ${RESOURCE_TABLES[resource]} WHERE project_id=$1 AND id=$2${lock ? ' FOR UPDATE' : ''}`, [projectId, resourceId]);
  if (!result.rowCount) throw new AcquisitionError('Объект не найден в проекте', 404);
  return result.rows[0] as Record<string, any>;
}
/** Записывает изменения и обновляет версию в той же транзакции. */
export async function recordAcquisitionChange(client: PoolClient, projectId: number, resource: AcquisitionResource, row: Record<string, unknown>, actorId: string | null, before: unknown = null): Promise<void> {
  await client.query('INSERT INTO analytics_acquisition_audit(project_id,resource,resource_id,actor_id,before_data,after_data) VALUES($1,$2,$3,$4,$5,$6)', [projectId, resource, row.id, actorId, before, row]);
  const version = await client.query(`INSERT INTO analytics_versions_v2(project_id,revision) VALUES($1,1)
    ON CONFLICT(project_id) DO UPDATE SET revision=analytics_versions_v2.revision+1 RETURNING revision`, [projectId]);
  await client.query(`INSERT INTO analytics_outbox_v2(project_id,token_id,revision,affected) VALUES($1,$2,$3,$4)`, [projectId, row.token_id ?? null, version.rows[0].revision, ['acquisition','sources']]);
  await client.query("SELECT pg_notify('analytics_v2_changed',$1)", [String(projectId)]);
}
/** Загружает список в проекте без утечки токена бота. */
export async function listAcquisition(client: PoolClient, projectId: number, resource: AcquisitionResource) {
  const result = resource === 'links'
    ? await client.query(`SELECT l.*,t.bot_username FROM analytics_links l LEFT JOIN bot_tokens t ON t.id=l.token_id AND t.project_id=l.project_id WHERE l.project_id=$1 ORDER BY l.id DESC`, [projectId])
    : await client.query(`SELECT * FROM ${RESOURCE_TABLES[resource]} WHERE project_id=$1 ORDER BY id DESC`, [projectId]);
  return result.rows.map(row => ({ ...acquisitionDto(row), ...(resource === 'links' ? { url: row.bot_username ? `https://t.me/${row.bot_username}?start=${row.code}` : null } : {}) }));
}
