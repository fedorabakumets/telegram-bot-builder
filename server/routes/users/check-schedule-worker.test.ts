/** @fileoverview Исполнитель расписаний не дублирует сроки и безопасно сохраняет ошибки запуска. */
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ claim:vi.fn(),outcome:vi.fn(),execute:vi.fn() }));
vi.mock('../check-history/schedule-store', () => ({ checkScheduleStore:{ claim:mocks.claim,outcome:mocks.outcome } }));
vi.mock('../check-history/run-scheduled-check', () => ({ runScheduledCheck:mocks.execute }));
import { tickCheckSchedules, runDueCheckScope } from '../check-history/schedule-worker';
beforeEach(() => { vi.resetAllMocks(); mocks.claim.mockResolvedValue(null); mocks.outcome.mockResolvedValue(undefined); });
/** Отсутствие активных расписаний не вызывает Telegram. */
it('не запускает ничего без наступившего срока', async () => {
  await tickCheckSchedules(); expect(mocks.execute).not.toHaveBeenCalled();
});
/** Зарезервированная попытка вызывает одну существующую очередь и сохраняет результат. */
it('запускает одну зарезервированную очередь', async () => {
  const row={ id:1,claim_id:'claim' }; mocks.claim.mockResolvedValueOnce(row); mocks.execute.mockResolvedValue('skipped_active');
  await tickCheckSchedules(); expect(mocks.execute).toHaveBeenCalledExactlyOnceWith(row);
  expect(mocks.outcome).toHaveBeenCalledWith(1,'claim','skipped_active');
});
/** Исключение хранится безопасным кодом без URL и токенов. */
it('не сохраняет сырое исключение', async () => {
  mocks.claim.mockResolvedValueOnce({ id:1,claim_id:'claim' }); mocks.execute.mockRejectedValue(new Error('секретный адрес'));
  await tickCheckSchedules(); expect(mocks.outcome).toHaveBeenCalledWith(1,'claim','error');
});

/** Немедленный запуск ограничен сохранённой областью и не забирает чужие расписания. */
it('запускает сразу только указанную область',async()=>{
  const scope={projectId:12,kind:'telegram-bots' as const,tokenId:9};
  mocks.claim.mockResolvedValueOnce({id:1,claim_id:'claim'});mocks.execute.mockResolvedValue('started');
  expect(await runDueCheckScope(scope)).toBe(true);
  expect(mocks.claim).toHaveBeenCalledWith(expect.any(Date),scope);
  expect(mocks.outcome).toHaveBeenCalledWith(1,'claim','started');
  expect(await runDueCheckScope(scope)).toBe(false);
  expect(mocks.execute).toHaveBeenCalledOnce();
});
