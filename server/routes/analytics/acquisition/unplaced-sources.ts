/** @fileoverview Автоматические строки источников без размещений с общей методикой первых контактов. */
import type { PoolClient } from 'pg';
import { queryV2Sources } from '../v2/query-sources';
/**
 * Читает найденные источники и не дублирует уже связанные размещения.
 * @param client - Соединение авторизованного отчёта.
 * @param project - Проект.
 * @param token - Выбранный бот либо весь проект.
 * @param from - Начало окна.
 * @param to - Конец окна.
 * @param timezone - Пояс.
 * @param currency - Валюта.
 * @returns Строки без выдуманного размещения или нулевого расхода.
 */
export async function unplacedSourceRows(client: PoolClient, project: number, token: number | null, from: string, to: string, timezone: string, currency: 'RUB' | 'USD') {
  /** Укрупняет вспомогательный ряд: таблице нужны только итоги источников. */
  const range = (start: string) => ({ from: start, to, timezone, period: null, step_ms: Math.max(86400000, Math.ceil((Date.parse(to)-Date.parse(start))/86400000/300)*86400000) });
  const current = await queryV2Sources(client, project, token, range(from));
  const all = from === '1900-01-01T00:00:00Z' ? current : await queryV2Sources(client, project, token, range('1900-01-01T00:00:00Z'));
  const { rows: registered } = await client.query('SELECT id::text id,name label FROM analytics_sources WHERE project_id=$1 AND archived_at IS NULL', [project]);
  const { rows: bound } = await client.query(`SELECT p.source_id::text key FROM analytics_placements p WHERE p.project_id=$1 AND ($2::integer IS NULL OR p.token_id=$2)
    UNION SELECT 'observed:'||h.marker FROM analytics_placement_history_v2 h JOIN analytics_placements p ON p.project_id=h.project_id AND p.id=h.placement_id AND p.token_id=h.token_id
      WHERE h.project_id=$1 AND ($2::integer IS NULL OR h.token_id=$2)`, [project, token]);
  const mapped = new Set(bound.map(item => item.key));
  const totals = new Map(current.sources.map(item => [item.id,item]));
  const discovered = new Map([...registered,...all.sources].map(item => [item.id,item]));
  return [...discovered.values()].filter(item => !mapped.has(item.id)).map(item => {
    const counts = totals.get(item.id);
    return { rowKey: `source:${item.id}`, sourceKey: item.id, placementId: null, name: item.label, sourceName: item.label,
      sourceId: /^\d+$/.test(item.id) ? Number(item.id) : null, tokenId: token, archivedAt: null,
      newUsers: counts?.new_users ?? 0, historicalUsers: counts?.restored_users ?? 0, returningUsers: counts?.returning_users ?? 0,
      repeatStarts: Math.max(0, (counts?.starts ?? 0) - (counts?.new_users ?? 0) - (counts?.restored_users ?? 0)), spend: { RUB: null, USD: null }, convertedSpend: null, costPerUser: null,
      costPerUserByCurrency: { RUB: null, USD: null }, currency, complete: false, reason: 'Расход не указан', isDemo: false, demoCostPerContact: null, estimated: false, currentDay: false,
    };
  });
}
