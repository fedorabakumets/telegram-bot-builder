/** @fileoverview Регрессии ограниченного параллельного запуска офлайн-ботов проекта. */
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ tokens: vi.fn(), instance: vi.fn(), create: vi.fn(), update: vi.fn(),
  desired: vi.fn(), start: vi.fn(), broadcast: vi.fn(), actual: vi.fn() }));
vi.mock('../../../storages/storage', () => ({ storage: { getBotTokensByProject: mocks.tokens,
  getBotInstanceByToken: mocks.instance, createBotInstance: mocks.create, updateBotInstance: mocks.update } }));
vi.mock('../../../bots/startBot', () => ({ startBot: mocks.start }));
vi.mock('../../../bots/setBotDesiredStatus', () => ({ setBotDesiredStatus: mocks.desired }));
vi.mock('../../../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));
vi.mock('../../../bots/restoreState', () => ({ isTokenPendingRestore: () => false }));
vi.mock('../resolve-actual-bot-status', () => ({ resolveActualBotStatus: mocks.actual }));
import { handleBotStartOfflineAll } from './botStartOfflineAllHandler';

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.tokens.mockResolvedValue(Array.from({ length: 8 }, (_, id) => ({ id: id + 1, token: `secret-${id}`, isActive: 1 })));
  mocks.instance.mockImplementation(async (id: number) => ({ id, desiredStatus: 'running', desiredGeneration: 2 }));
  mocks.actual.mockResolvedValue('stopped');
  mocks.desired.mockResolvedValue(2);
  mocks.broadcast.mockResolvedValue(undefined);
});

/** Вызывает маршрут с минимальным ответом Express без сети. */
async function request() {
  const result = { code: 200, body: null as any };
  const response = { status(code: number) { result.code = code; return this; },
    json(body: any) { result.body = body; return this; } };
  await handleBotStartOfflineAll({ params: { id: '12' }, get: () => undefined } as any, response as any);
  return result;
}

it('держит до пяти незавершённых запусков и возвращает результаты в порядке токенов', async () => {
  let active = 0, maximum = 0;
  mocks.start.mockImplementation(async () => {
    active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 5)); active--;
    return { success: true, processId: 'worker' };
  });
  const response = await request();
  expect(maximum).toBe(5);
  expect(active).toBe(0);
  expect(response.code).toBe(200);
  expect(response.body.started).toBe(8);
  expect(response.body.results.map((item: any) => item.tokenId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});

it('ошибка отдельного запуска не завершает группу досрочно и скрывает секрет', async () => {
  mocks.start.mockImplementation(async (_project: number, token: string, id: number) => {
    if (id === 2) throw new Error(`неудача ${token}`);
    return { success: true };
  });
  const response = await request();
  expect(mocks.start).toHaveBeenCalledTimes(8);
  expect(response.body.started).toBe(7);
  expect(response.body.failed).toBe(1);
  expect(response.body.results[1].error).toBe('неудача [скрыто]');
});

it('новая остановка после фиксации намерения отменяет запуск', async () => {
  mocks.instance.mockResolvedValue({ id: 1, desiredStatus: 'stopped', desiredGeneration: 3 });
  const response = await request();
  expect(mocks.start).not.toHaveBeenCalled();
  expect(response.body.failed).toBe(8);
});
