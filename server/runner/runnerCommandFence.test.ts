/** @fileoverview Проверки актуальности команд ботов и изоляции ленивого подключения исполнителя. */
import { afterEach, expect, it, vi } from 'vitest';

/** Подмена драйвера исключает обращения к реальной базе данных. */
const mocks = vi.hoisted(() => ({ query: vi.fn(), end: vi.fn(), create: vi.fn() }));
vi.mock('pg', () => ({ Pool: class {
  /** Сохраняет настройки создаваемого пула. */
  constructor(options: unknown) { mocks.create(options); }
  /** Выполняет подменённый запрос проверки команды. */
  query = mocks.query;
  /** Закрывает подменённый пул. */
  end = mocks.end;
  /** Подписывает обработчик ошибки без реального соединения. */
  on = vi.fn();
} }));
import { closeBotCommandFence, isCurrentBotCommand } from './runnerCommandFence';

afterEach(async () => { await closeBotCommandFence(); vi.clearAllMocks(); vi.unstubAllEnvs(); });

it('не создаёт соединения при импорте и отклоняет некорректные идентификаторы', async () => {
  expect(mocks.create).not.toHaveBeenCalled();
  expect(await isCurrentBotCommand({ instance_id: NaN, token_id: 1, desired_generation: 1 }, 'start_bot')).toBe(false);
  expect(mocks.create).not.toHaveBeenCalled();
});

it('проверяет поколение, токен и желаемое состояние через узкий повторно используемый пул', async () => {
  vi.stubEnv('DATABASE_URL', 'postgres://localhost/test');
  const fence = { instance_id: 9, token_id: 4, desired_generation: 3 };
  mocks.query.mockResolvedValue({ rows: [{ tokenId: 4, desiredGeneration: 3, desiredStatus: 'running' }] });
  expect(await isCurrentBotCommand(fence, 'start_bot')).toBe(true);
  expect(await isCurrentBotCommand({ ...fence, desired_generation: 2 }, 'start_bot')).toBe(false);
  expect(await isCurrentBotCommand({ ...fence, token_id: 5 }, 'start_bot')).toBe(false);
  mocks.query.mockResolvedValue({ rows: [{ tokenId: 4, desiredGeneration: 3, desiredStatus: 'stopped' }] });
  expect(await isCurrentBotCommand(fence, 'start_bot')).toBe(false);
  expect(await isCurrentBotCommand(fence, 'stop_bot')).toBe(true);
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ max: 2, idleTimeoutMillis: 10000 }));
  expect(mocks.query).toHaveBeenLastCalledWith(expect.any(String), [9]);
});

it('передаёт ошибку запроса вызывающему вместо разрешения устаревшей команды', async () => {
  vi.stubEnv('DATABASE_URL', 'postgres://localhost/test');
  mocks.query.mockRejectedValueOnce(new Error('unavailable'));
  await expect(isCurrentBotCommand({ instance_id: 9, token_id: 4, desired_generation: 3 }, 'start_bot')).rejects.toThrow('unavailable');
});
