/** @fileoverview Проверки атомарного перевода на все общие настройки с замоканной базой. */

import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { BOT_INHERITED_SETTING_KEYS } from '../../shared/bot-inherited-settings';

const mocks = vi.hoisted(() => ({ select: vi.fn(), set: vi.fn(), clear: vi.fn(), transaction: vi.fn() }));
vi.mock('@shared/schema', () => ({ botEnvVariables: {}, botProjects: {}, botTokens: {} }));
vi.mock('drizzle-orm', () => ({ and: vi.fn(), eq: vi.fn(), inArray: vi.fn() }));
vi.mock('../database/db', () => ({ db: { transaction: mocks.transaction } }));

import { adoptProjectLaunchMode } from './adoptProjectLaunchMode';

/** Бот с четырьмя унаследованными флагами и одним индивидуальным полем. */
const partiallyInherited = {
  id: 6, inheritLaunchMode: true, inheritSleepMode: true, inheritAutoRestart: true, inheritMaxRestartAttempts: true,
  webhookBaseUrl: 'https://individual.example.com',
  inheritBotSettings: BOT_INHERITED_SETTING_KEYS.filter((key) => key !== 'messagesRetentionDays'),
};

/**
 * Подставляет результаты запросов проекта и токенов для одной транзакции.
 * @param project - Снимок настроек проекта.
 * @param tokens - Боты, найденные в проекте.
 */
function mockRows(project: object, tokens: object[]) {
  mocks.select.mockReturnValueOnce({ from: () => ({ where: () => ({ for: async () => [project] }) }) });
  mocks.select.mockReturnValueOnce({ from: () => ({ where: () => ({ orderBy: () => ({ for: async () => tokens }) }) }) });
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.transaction.mockImplementation((fn) => fn({
    select: mocks.select, update: () => ({ set: mocks.set }), delete: () => ({ where: mocks.clear }),
  }));
  mocks.set.mockReturnValue({ where: vi.fn() });
  vi.stubEnv('API_BASE_URL', '');
  vi.stubEnv('WEBHOOK_URL', '');
});
afterEach(() => vi.unstubAllEnvs());

it('учитывает даже одно индивидуальное поле при массовом наследовании', async () => {
  mockRows({ launchMode: 'polling', sleepMode: 'direct' }, [partiallyInherited]);
  expect(await adoptProjectLaunchMode(10, [6], 'all')).toEqual([6]);
  expect(mocks.set).toHaveBeenCalledOnce();
  expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ inheritBotSettings: [...BOT_INHERITED_SETTING_KEYS] }));
});

it('не записывает настройки, если один из выбранных токенов не принадлежит проекту', async () => {
  mockRows({ launchMode: 'polling', sleepMode: 'direct' }, [partiallyInherited]);
  expect(await adoptProjectLaunchMode(10, [6, 64], 'all')).toBeNull();
  expect(mocks.set).not.toHaveBeenCalled();
  expect(mocks.clear).not.toHaveBeenCalled();
});

it('проверяет итоговый адрес проекта вместо индивидуального адреса бота до первой записи', async () => {
  mockRows({ launchMode: 'webhook', sleepMode: 'direct', botSettingDefaults: { webhookBaseUrl: null } }, [partiallyInherited]);
  await expect(adoptProjectLaunchMode(10, [6], 'all')).rejects.toThrow(/публичный адрес/);
  expect(mocks.set).not.toHaveBeenCalled();
  expect(mocks.clear).not.toHaveBeenCalled();
});
