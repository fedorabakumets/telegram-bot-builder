/** @fileoverview Общие настройки сбрасывают кеш проекта только после подтверждённой записи. */
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), transaction: vi.fn(), update: vi.fn(),
  select: vi.fn(), rows: [] as unknown[], events: [] as string[] }));
vi.mock('../database/db-cache', () => ({ cachedOps: { invalidateProject: mocks.invalidate } }));
vi.mock('../database/db', () => ({ db: { transaction: mocks.transaction, update: mocks.update } }));
vi.mock('@shared/schema', () => ({ botProjects: {}, botTokens: {}, botEnvVariables: {} }));
vi.mock('./runtimeModePolicy', () => ({ resolveRuntimeModeSettings: vi.fn(), validateRuntimeMode: vi.fn(),
  RuntimeModeValidationError: class extends Error {} }));
vi.mock('./webhookBaseUrl', () => ({ resolveWebhookBaseUrl: () => 'https://example.test' }));

import { saveProjectLaunchDefault } from './projectLaunchDefault';
import { saveProjectBotSettingDefaults } from './projectBotSettingDefaults';
import { saveProjectRuntimeDefaults } from './projectRuntimeDefaults';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.events.length = 0;
  mocks.rows = [{ defaults: {}, sleepMode: 'process' }];
  mocks.invalidate.mockImplementation(() => mocks.events.push('invalidate'));
  mocks.select.mockImplementation(() => ({ from: () => ({ where: () => ({
    for: async () => mocks.rows, orderBy: () => ({ for: async () => [] }),
  }) }) }));
  mocks.update.mockImplementation(() => ({ set: () => ({ where: () => ({
    returning: async () => { mocks.events.push('commit'); return mocks.rows; },
  }) }) }));
  mocks.transaction.mockImplementation(async callback => {
    const result = await callback({ select: mocks.select, update: mocks.update });
    mocks.events.push('commit');
    return result;
  });
});

/** Каждый способ записи должен обновлять последующий запуск и DTO настроек. */
it.each(['launch', 'settings', 'runtime'] as const)('сбрасывает кеш после записи %s', async kind => {
  if (kind === 'launch') await saveProjectLaunchDefault(10, 'polling');
  if (kind === 'settings') await saveProjectBotSettingDefaults(10, { contentCache: 1 });
  if (kind === 'runtime') await saveProjectRuntimeDefaults(10, { autoRestart: 1 });
  expect(mocks.invalidate).toHaveBeenCalledWith(10);
  expect(mocks.events).toEqual(['commit', 'invalidate']);
});

it('не сбрасывает кеш до окончания неуспешной транзакции', async () => {
  mocks.transaction.mockRejectedValueOnce(new Error('rollback'));
  await expect(saveProjectLaunchDefault(10, 'polling')).rejects.toThrow('rollback');
  expect(mocks.invalidate).not.toHaveBeenCalled();
});

it('не сбрасывает кеш для отсутствующего проекта', async () => {
  mocks.rows = [];
  expect(await saveProjectBotSettingDefaults(10, { contentCache: 1 })).toBeNull();
  expect(mocks.invalidate).not.toHaveBeenCalled();
});
