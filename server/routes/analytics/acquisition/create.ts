/** @fileoverview Создание рекламной площадки, размещения и зарегистрированной ссылки. */
import { randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { AcquisitionError, sourceInput, placementInput, linkInput } from './validation';
import { findStartConflict } from './link-routing';
import { scopedRow, type AcquisitionResource } from './storage';
/** Проверяет существование бота внутри проекта без чтения его секрета. */
export async function acquisitionBot(client: PoolClient, projectId: number, tokenId: number) {
  const result = await client.query('SELECT id,bot_username FROM bot_tokens WHERE project_id=$1 AND id=$2', [projectId, tokenId]);
  if (!result.rowCount) throw new AcquisitionError('Бот не принадлежит проекту', 403);
  return result.rows[0] as { id: number; bot_username: string | null };
}
/** Создаёт объект с проверкой всех связанных ресурсов. */
export async function createAcquisition(client: PoolClient, projectId: number, resource: Exclude<AcquisitionResource, 'expenses'>, body: unknown): Promise<Record<string, any>> {
  if (resource === 'sources') {
    const input = sourceInput.parse(body);
    return (await client.query('INSERT INTO analytics_sources(project_id,name,kind,url) VALUES($1,$2,$3,$4) RETURNING *', [projectId,input.name,input.kind,input.url ?? null])).rows[0];
  }
  if (resource === 'placements') {
    const input = placementInput.parse(body);
    await acquisitionBot(client, projectId, input.tokenId);
    const source = await scopedRow(client, 'sources', projectId, input.sourceId);
    if (source.archived_at) throw new AcquisitionError('Источник находится в архиве');
    if (input.startsOn && input.endsOn && input.endsOn < input.startsOn) throw new AcquisitionError('Последний день раньше первого');
    return (await client.query(`INSERT INTO analytics_placements(project_id,token_id,source_id,name,starts_on,ends_on,timezone) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [projectId,input.tokenId,input.sourceId,input.name,input.startsOn ?? null,input.endsOn ?? null,input.timezone])).rows[0];
  }
  const input = linkInput.parse(body);
  const placement = await scopedRow(client, 'placements', projectId, input.placementId);
  if (placement.archived_at) throw new AcquisitionError('Размещение находится в архиве');
  const bot = await acquisitionBot(client, projectId, placement.token_id);
  if (!bot.bot_username || !/^[A-Za-z0-9_]+$/.test(bot.bot_username)) throw new AcquisitionError('У бота отсутствует username. Обновите сведения о боте');
  if (input.referrerId) {
    const referrer = await client.query('SELECT 1 FROM analytics_audience_v2 WHERE project_id=$1 AND user_id=$2 LIMIT 1', [projectId,input.referrerId]);
    if (!referrer.rowCount) throw new AcquisitionError('Пригласивший не найден среди подтверждённых пользователей проекта');
  }
  if ((input.purpose === 'referral' || input.purpose === 'combined') && !input.referrerId) throw new AcquisitionError('Выберите подтверждённого пригласившего');
  const project = await client.query('SELECT data FROM bot_projects WHERE id=$1', [projectId]);
  const code = `bc_${randomBytes(18).toString('base64url')}`;
  const conflict = findStartConflict(project.rows[0]?.data, code);
  if (conflict) throw new AcquisitionError(`Метка пересекается с маршрутом start (${conflict}). Уточните префикс маршрута в сценарии`, 409);
  const row = (await client.query(`INSERT INTO analytics_links(project_id,token_id,source_id,placement_id,code,purpose,referrer_id)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [projectId,placement.token_id,placement.source_id,placement.id,code,input.purpose ?? (input.referrerId ? 'combined' : 'acquisition'),input.referrerId ?? null])).rows[0];
  return { ...row, url: `https://t.me/${bot.bot_username}?start=${code}` };
}
