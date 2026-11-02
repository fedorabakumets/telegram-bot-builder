/** @fileoverview Проверки пустых расходов, повторного привлечения и неполной рекламной истории на PostgreSQL. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PoolClient } from 'pg';
import { createAnalyticsTestDatabase } from '../v2/test-database';
import { acquisitionReport } from './report';
import { createExpenses } from './expenses';

/** Изолированная схема не затрагивает данные открытого приложения. */
const db = createAnalyticsTestDatabase();
/** Соединение для вызова той же логики, которую используют HTTP и MCP. */
let client: PoolClient;
/** Полный календарный день в московском поясе. */
const range = { from: '2026-10-19T21:00:00Z', to: '2026-10-20T21:00:00Z', tokenId: 11 };

beforeAll(async () => {
  await db.setup();
  client = await db.pool.connect();
  await client.query(`SELECT mark_analytics_runtime_v2(1,11);
    UPDATE analytics_runtime_v2 SET coverage_from='2026-09-01T00:00:00Z';
    INSERT INTO analytics_sources(id,project_id,name) VALUES(7,1,'Первая площадка'),(8,1,'Вторая площадка');
    INSERT INTO analytics_placements(id,project_id,token_id,source_id,name,timezone)
      VALUES(7,1,11,7,'Первое размещение','Europe/Moscow'),
        (8,1,11,8,'Повторная реклама','Europe/Moscow'),(9,1,11,8,'Старая история','Europe/Moscow');
    INSERT INTO analytics_links(id,project_id,token_id,source_id,placement_id,code)
      VALUES(7,1,11,7,7,'bc_first'),(8,1,11,8,8,'bc_return'),(9,1,11,8,9,'bc_history');`);
  await db.record({ event_key: 'msg:777:1', user_id: '777', chat_id: '777', source_id: 7,
    placement_id: 7, link_id: 7, attribution_status: 'resolved', metadata: { entry: true } });
  await db.record({ event_key: 'msg:777:2', user_id: '777', chat_id: '777', source_id: 8,
    placement_id: 8, link_id: 8, attribution_status: 'resolved', metadata: { entry: true }, occurred_at: '2026-10-20T13:00:00Z' });
}, 30000);

afterAll(async () => { client?.release(); await db.cleanup(); });

describe.sequential('Границы расчёта рекламной цены', () => {
  it('отличает отсутствие расхода от явно указанной нулевой оплаты', async () => {
    const before = (await acquisitionReport(client, 1, range)).rows.find(row => row.placementId === 7)!;
    expect(before).toMatchObject({ newUsers: 1, spend: { RUB: null, USD: null }, costPerUser: null, reason: 'Расход не указан' });
    await createExpenses(client, 1, { placementId: 7, amount: '0.00', currency: 'RUB', day: '2026-10-20' });
    const after = (await acquisitionReport(client, 1, range)).rows.find(row => row.placementId === 7)!;
    expect(after).toMatchObject({ spend: { RUB: '0.00', USD: null }, costPerUser: '0.00', complete: true });
  });

  it('сохраняет первое привлечение и отдельно учитывает возврат по другой ссылке', async () => {
    await createExpenses(client, 1, { placementId: 8, amount: '3000.00', currency: 'RUB', day: '2026-10-20' });
    const rows = (await acquisitionReport(client, 1, range)).rows;
    expect(rows.find(row => row.placementId === 7)).toMatchObject({ newUsers: 1, returningUsers: 0 });
    /** Первое обращение внутри окна исключает человека из вернувшихся, сохраняя повторный запуск. */
    expect(rows.find(row => row.placementId === 8)).toMatchObject({ newUsers: 0, returningUsers: 0,
      repeatStarts: 1, costPerUser: null, reason: 'Нет привлечённых пользователей' });
    const later=(await acquisitionReport(client,1,{...range,from:'2026-10-20T12:30:00Z'})).rows;
    expect(later.find(row=>row.placementId===8)).toMatchObject({newUsers:0,returningUsers:1,repeatStarts:1});
    const first = await client.query("SELECT placement_id FROM analytics_audience_v2 WHERE project_id=1 AND token_id=11 AND user_id='777'");
    expect(first.rows[0].placement_id).toBe(7);
  });

  it('не превращает неизвестную дату первого использования в точное привлечение', async () => {
    await db.record({ event_key: 'msg:888:1', user_id: '888', chat_id: '888', source_id: 8,
      placement_id: 9, link_id: 9, provenance: 'backfill', first_known: false, attribution_status: 'resolved' });
    await createExpenses(client, 1, { placementId: 9, amount: '20.00', currency: 'USD', day: '2026-10-20' });
    const row = (await acquisitionReport(client, 1, range)).rows.find(item => item.placementId === 9)!;
    expect(row).toMatchObject({ newUsers: 0, spend: { RUB: null, USD: '20.00' }, costPerUser: null,
      costPerUserByCurrency: { RUB: null, USD: null }, complete: false });
    expect(row.reason).toContain('неполная');
  });

  it('отклоняет неявное распределение и сохраняет точную сумму явного', async () => {
    const input = { placementId: 7, amount: '100.00', currency: 'RUB', day: '2026-10-21', untilDay: '2026-10-23' };
    await expect(createExpenses(client, 1, input)).rejects.toThrow('Подтвердите распределение');
    const parts = await createExpenses(client, 1, { ...input, allocation: 'equal' });
    expect(parts.map(part => part.amount)).toEqual(['33.33', '33.33', '33.34']);
    expect(parts.every(part => part.estimated === true)).toBe(true);
    expect(new Set(parts.map(part => part.allocation_group_id)).size).toBe(1);
    const total = await client.query('SELECT sum(amount)::text AS total FROM analytics_expenses WHERE allocation_group_id=$1', [parts[0].allocation_group_id]);
    expect(total.rows[0].total).toBe('100.00');
  });
});
