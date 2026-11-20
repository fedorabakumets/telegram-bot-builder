/** @fileoverview Постоянные расписания и конкурентная резервация в изолированной PostgreSQL-схеме. */
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHistoryTestDatabase } from './check-history-test-database';
vi.mock('../../database/db', () => ({ pool: null }));
import { createCheckScheduleStore } from '../check-history/schedule-store';
const database = createHistoryTestDatabase(), store = createCheckScheduleStore(database.pool);
beforeAll(async () => {
  await database.setup(); const sql = await readFile('migrations/0044_check_schedules.sql','utf8');
  await database.pool.query(sql); await database.pool.query(sql);
});
afterAll(() => database.cleanup());
/** Повторное сохранение обновляет единственную область, не смешивая проекты и виды проверок. */
it('сохраняет интервал и восстанавливает его новым экземпляром', async () => {
  const settings = { enabled: false, every: 60, unit: 'minute' as const, firstAt: '2026-12-17T08:00:00Z' };
  await store.save(12,'private-chats',null,1,settings);
  await store.save(12,'private-chats',null,1,{ ...settings,every: 6,unit:'hour' });
  const restored = await createCheckScheduleStore(database.pool).get(12,'private-chats',null);
  expect(restored).toMatchObject({ every:6,unit:'hour',enabled:false });
  expect(await store.get(13,'private-chats',null)).toBeNull();
  expect(await store.get(12,'telegram-bots',null)).toBeNull();
});
/** Несколько серверов не выполняют одну запланированную попытку дважды. */
it('резервирует срок один раз и не накапливает пропуски', async () => {
  await store.save(12,'telegram-bots',9,1,{ enabled:true,every:6,unit:'hour',firstAt:'2026-12-01T08:00:00Z' });
  const now = new Date('2027-01-01T08:01:00Z');
  const rows = (await Promise.all([store.claim(now),store.claim(now)])).filter(Boolean);
  expect(rows).toHaveLength(1);
  expect((await store.get(12,'telegram-bots',9))?.nextRunAt).toBe('2027-01-01T14:00:00.000Z');
  const row = rows[0]!;
  await store.outcome(row.id,'чужой-идентификатор','error');
  expect((await store.get(12,'telegram-bots',9))?.lastOutcome).toBe('starting');
  await store.outcome(row.id,row.claim_id,'started');
  expect((await store.get(12,'telegram-bots',9))?.lastOutcome).toBe('started');
});
/** Отключённое расписание не выбирается исполнителем. */
it('не резервирует отключённые расписания', async () => {
  await database.pool.query('UPDATE check_schedules SET enabled=false');
  expect(await store.claim(new Date('2030-01-01T00:00:00Z'))).toBeNull();
});

/** Текущая минута запускается сразу, затем отсчёт ведётся от фактического сохранения. */
it('запускает сейчас один раз и переносит следующий срок на 6 часов',async()=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-17T08:45:30Z'));
  try {
    const scope={projectId:12,kind:'private-chats' as const,tokenId:10};
    const settings={enabled:true,every:6,unit:'hour' as const,firstAt:'2026-11-17T08:45:00Z'};
    const saved=await store.save(12,'private-chats',10,1,settings);
    expect(saved.nextRunAt).toBe('2026-11-17T08:45:30.000Z');
    const claims=(await Promise.all([store.claim(new Date(),scope),store.claim(new Date(),scope)])).filter(Boolean);
    expect(claims).toHaveLength(1);
    expect((await store.get(12,'private-chats',10))?.nextRunAt).toBe('2026-11-17T14:45:30.000Z');
    await store.save(12,'private-chats',10,1,{...settings,enabled:false});
    expect(await store.claim(new Date(),scope)).toBeNull();
  } finally {vi.useRealTimers();}
});
