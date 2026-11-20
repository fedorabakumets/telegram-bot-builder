/** @fileoverview Проверка записи и сброса индивидуального режима сна без соединения с БД. */

import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  select: vi.fn(), set: vi.fn(), insert: vi.fn(), clear: vi.fn(), transaction: vi.fn(),
}));
vi.mock('@shared/schema', () => ({
  botEnvVariables: {}, botProjects: {}, botTokens: {},
}));
vi.mock('drizzle-orm', () => ({ and: vi.fn(), eq: vi.fn() }));
vi.mock('../database/db', () => ({ db: { transaction: mocks.transaction } }));

import { saveRuntimeMode, saveRuntimeModeSettings } from './runtimeModeSettings';

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.transaction.mockImplementation((fn) => fn({
    select: mocks.select,
    update: () => ({ set: mocks.set }),
    insert: () => ({ values: mocks.insert }),
    delete: () => ({ where: mocks.clear }),
  }));
  mocks.set.mockReturnValue({ where: vi.fn() });
  mocks.select.mockReturnValueOnce({
    from: () => ({ where: () => ({ for: async () => [{ defaultLaunchMode: 'polling', defaultSleepMode: 'process' }] }) }),
  });
});

/**
 * Подставляет текущий источник режима из замоканной базы.
 * @param inherited - Состояние наследования до записи.
 */
function mockToken(inherited: boolean) {
  mocks.select.mockReturnValueOnce({
    from: () => ({ where: () => ({ for: async () => [{ launchMode: 'polling', inheritSleepMode: inherited }] }) }),
  });
  mocks.select.mockReturnValueOnce({
    from: () => ({ where: () => ({ orderBy: async () => [{ key: 'BOT_POLLING_MODE', value: 'ondemand' }] }) }),
  });
}

it('при записи собственного режима отключает наследование только для сна', async () => {
  mockToken(true);
  const result = await saveRuntimeMode(42, 'direct', 10);
  expect(mocks.set).toHaveBeenCalledWith({ inheritSleepMode: false });
  expect(mocks.insert).toHaveBeenCalledWith({ tokenId: 42, key: 'BOT_POLLING_MODE', value: 'direct', isSecret: 0 });
  expect(result).toMatchObject({ mode: 'direct', source: 'bot', inheritSleepMode: false });
});

it('при пакетном сбросе сна удаляет прежнюю переменную и снова наследует проект', async () => {
  mockToken(false);
  const result = await saveRuntimeModeSettings(42, { resetMode: true }, 10);
  expect(mocks.clear).toHaveBeenCalledOnce();
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.set).toHaveBeenCalledWith({ inheritSleepMode: true });
  expect(result).toMatchObject({ mode: 'process', source: 'project', inheritSleepMode: true });
});
