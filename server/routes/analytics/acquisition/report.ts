/** @fileoverview Рекламный отчёт: указанные дневные расходы видны при любом окне, ограничения периода относятся к расчёту цены. */
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { AcquisitionError, timezone } from './validation';
import { ACQUISITION_REPORT_SQL } from './report-query';
import { unplacedSourceRows } from './unplaced-sources';
import { acquisitionBot } from './create';
/** Параметры отчёта; без дат показывается весь срок размещений. */
export const reportInput = z.object({
  /** Включить автоматически найденные источники без размещений. */ includeSources: z.enum(['true','false']).optional(),
  /** Бот либо весь проект. */ tokenId: z.coerce.number().int().positive().optional(),
  /** Включённая граница. */ from: z.string().datetime({ offset: true }).optional(),
  /** Исключённая граница. */ to: z.string().datetime({ offset: true }).optional(),
  /** Пояс отображения. */ timezone: timezone.default('Europe/Moscow'),
  /** Валюта ручного пересчёта. */ currency: z.enum(['RUB','USD']).default('RUB'),
  /** Размещение для подробного отчёта. */ placementId: z.coerce.number().int().positive().optional(),
}).strict();
/** Возвращает объяснение отсутствующей цены, не превращая неизвестное в ноль. */
function reportReason(row: Record<string, any>, lifetime: boolean): string | null {
  if (!lifetime && !row.whole_days) return 'Для цены выберите полные календарные дни или весь срок размещения';
  if (!row.covered || row.unknown_users > 0) return 'История подтверждённых взаимодействий неполная';
  if (!row.expense_count) return 'Расход не указан';
  if (row.missing_rates) return `Не указан курс у ${row.missing_rates} записей`;
  if (!row.new_users) return 'Нет привлечённых пользователей';
  return null;
}
/** Получает финансовый снимок без отдельной логики округления на клиенте. */
export async function acquisitionReport(client: PoolClient, projectId: number, query: unknown) {
  const input = reportInput.parse(query), now = new Date();
  if ((input.from === undefined) !== (input.to === undefined)) throw new AcquisitionError('Укажите обе границы периода');
  const lifetime = input.from === undefined;
  const from = input.from ?? '1900-01-01T00:00:00Z', to = input.to ?? now.toISOString();
  if (Date.parse(from) >= Date.parse(to) || Date.parse(to) > now.getTime() + 1000) throw new AcquisitionError('Некорректный диапазон отчёта');
  if (input.tokenId) await acquisitionBot(client, projectId, input.tokenId);
  const result = await client.query(ACQUISITION_REPORT_SQL, [projectId,input.tokenId ?? null,from,to,input.currency,now.toISOString(),input.placementId ?? null]);
  const rows = result.rows.map(row => {
    const reason = reportReason(row, lifetime), validDays = lifetime || row.whole_days;
    const validPrice = validDays && row.covered && row.unknown_users === 0 && row.new_users > 0;
    return { placementId: row.placement_id, name: row.name, tokenId: row.token_id, sourceId: row.source_id,
      sourceName: row.source_name, archivedAt: row.archived_at, newUsers: row.new_users, returningUsers: row.returning_users,
      historicalUsers: row.historical_users, isDemo: row.is_demo, demoCostPerContact: row.demo_cost_per_contact,
      repeatStarts: row.repeat_starts, spend: { RUB: row.rub, USD: row.usd },
      convertedSpend: !row.missing_rates ? row.converted : null, costPerUser: reason ? null : row.cpa,
      costPerUserByCurrency: { RUB: validPrice ? row.cpa_rub : null, USD: validPrice ? row.cpa_usd : null },
      currency: input.currency, complete: !reason, reason, estimated: row.estimated, currentDay: row.current_day };
  });
  const automatic = input.includeSources === 'true' && !input.placementId ? await unplacedSourceRows(client, projectId, input.tokenId ?? null, from, to, input.timezone, input.currency) : [];
  return { rows: [...rows, ...automatic], asOf: now.toISOString(), from, to, timezone: input.timezone, lifetime };
}
