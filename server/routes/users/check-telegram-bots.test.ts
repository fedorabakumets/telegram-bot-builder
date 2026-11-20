/** @fileoverview Проверки сохранения результата getMe без включения ботов и без ложных сетевых блокировок. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BotToken } from '@shared/schema';
import type { TelegramBotCheckItem } from '@shared/telegram-bot-check';
const { query, probe, emit } = vi.hoisted(() => ({ query: vi.fn(), probe: vi.fn(), emit: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query } }));
vi.mock('./probe-telegram-bot', () => ({ probeTelegramBot: probe }));
vi.mock('../../terminal/emitTokenUpdated', () => ({ emitTokenUpdated: emit }));
import { checkTelegramBots } from './check-telegram-bots';
/** Токен отключённого ранее бота для регрессионной проверки восстановления авторизации. */
const token = { id: 9, projectId: 12, token: '123:secret', isActive: 0, authorizationError: 'unauthorized' } as BotToken;
beforeEach(() => { vi.clearAllMocks(); query.mockResolvedValue({ rowCount: 1, rows: [{ user_id: '456' }] }); emit.mockResolvedValue(undefined); });
describe('Обновление доступности ботов', () => {
  it('снимает отказ токена, не включая отключённого бота и не раскрывая секрет', async () => {
    probe.mockResolvedValue('available');
    const result = await checkTelegramBots([token]);
    expect(query.mock.calls[0][1]).toEqual([12, 9, null, '123:secret', false]);
    expect(probe).toHaveBeenCalledWith('123:secret', expect.any(Function));
    expect(result.available).toBe(1);
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  it('сохраняет подтверждённый отказ с проверкой неизменности секрета', async () => {
    probe.mockResolvedValue('unauthorized');
    expect((await checkTelegramBots([token])).unavailable).toBe(1);
    expect(query.mock.calls[0][0]).toContain('AND token=$4');
    expect(query.mock.calls[0][1]).toEqual([12, 9, 'unauthorized', '123:secret', true]);
    query.mockResolvedValue({ rowCount: 0 });
    expect((await checkTelegramBots([token])).errors).toBe(1);
  });
  it('оставляет прежний статус при сетевой ошибке', async () => {
    probe.mockResolvedValue('error');
    expect((await checkTelegramBots([token])).errors).toBe(1);
    expect(query.mock.calls.every(call => !call[0].includes('UPDATE'))).toBe(true);
  });
  /** Сохраняет отдельную причину заморозки после успешной авторизации токена. */
  it('фиксирует явную заморозку самого бота', async () => {
    probe.mockResolvedValue('telegram_frozen');
    expect((await checkTelegramBots([token])).unavailable).toBe(1);
    expect(query.mock.calls[0][1]).toEqual([12, 9, 'telegram_frozen', '123:secret', true]);
  });
  /** Подробности ошибки содержат имя и метод, но не секретный токен. */
  it('возвращает понятную причину и имя непроверенного бота', async () => {
    probe.mockImplementation(async (_secret, report) => {
      report({ method: 'getMyCommands', reason: 'timeout' }); return 'error';
    });
    const result = await checkTelegramBots([{ ...token, name: 'Тест', botUsername: 'example_bot' }]);
    expect(result.items[0]).toMatchObject({ status: 'error', reason: 'timeout', method: 'getMyCommands', username: 'example_bot' });
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  it('ограничивает число одновременных проверок четырьмя', async () => {
    let active = 0, maximum = 0;
    probe.mockImplementation(async () => {
      maximum = Math.max(maximum, ++active);
      await new Promise(resolve => setTimeout(resolve, 1));
      active--; return 'available';
    });
    const result = await checkTelegramBots(Array.from({ length: 9 }, (_, index) => ({ ...token, id: index + 1 })));
    expect(result.available).toBe(9); expect(maximum).toBe(4);
  });
  /** Быстрый бот публикуется немедленно, не ожидая медленного соседа. */
  it('публикует частичные результаты до завершения всей проверки', async () => {
    let finish!: (result: string) => void;
    probe.mockImplementation(secret => secret === token.token ? new Promise(resolve => { finish = resolve; }) : Promise.resolve('available'));
    const progress = vi.fn();
    const pending = checkTelegramBots([token, { ...token, id: 10, token: 'fast' }], progress);
    await vi.waitFor(() => expect(progress).toHaveBeenCalledTimes(1));
    expect(progress.mock.calls[0][0]).toMatchObject({ available: 1, items: [{ tokenId: 10 }] });
    expect(JSON.stringify(progress.mock.calls)).not.toContain('secret');
    finish('telegram_frozen');
    expect((await pending).items).toHaveLength(2);
    expect(progress).toHaveBeenCalledTimes(2);
  });
});


/** Подписчик не видит результат до завершения обязательной записи истории. */
it('ожидает сохранение результата перед прогрессом', async () => {
  probe.mockResolvedValue('available');
  let persist!: () => void;
  const progress = vi.fn(), onItem = vi.fn((_item: TelegramBotCheckItem) => new Promise<void>(resolve => { persist = resolve; }));
  const task = checkTelegramBots([token], progress, onItem);
  await vi.waitFor(() => expect(onItem).toHaveBeenCalledOnce());
  expect(progress).not.toHaveBeenCalled();
  persist();
  await task;
  expect(progress).toHaveBeenCalledOnce();
  expect(onItem.mock.calls[0][0]).toMatchObject({ tokenId: 9, startedAt: expect.any(String), finishedAt: expect.any(String) });
});
/** Сбой истории не проглатывается как ошибка необязательного подписчика. */
it('прерывает итог при ошибке обязательного сохранения', async () => {
  probe.mockResolvedValue('available');
  const progress = vi.fn();
  await expect(checkTelegramBots([token], progress, async () => { throw new Error('База недоступна'); })).rejects.toThrow('База недоступна');
  expect(progress).not.toHaveBeenCalled();
});
