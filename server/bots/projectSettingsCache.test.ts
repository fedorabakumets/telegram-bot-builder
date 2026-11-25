/** @fileoverview Регрессия запуска после сохранения сна, транспорта и общих настроек проекта. */
import type { BotProject } from '@shared/schema';
import { beforeEach, expect, it, vi } from 'vitest';
import { cachedOps } from '../database/db-cache';
import { resolveProjectSleepMode } from '../../shared/bot-execution-settings';

const state = vi.hoisted(() => ({
  row: { id: 990009, defaultSleepMode: 'process', defaultLaunchMode: 'polling', botSettingDefaults: {} },
  fail: false,
}));
vi.mock('../database/db', () => {
  /** Возвращает проект или пустой список токенов для проверок транзакции. */
  function select(columns?: Record<string, unknown>) {
    const rows = columns && 'inherits' in columns ? [] : [{ ...state.row }];
    const chain = {
      from: () => chain, where: () => chain, orderBy: () => chain,
      for: async () => rows,
      then: (resolve: (value: typeof rows) => unknown) => Promise.resolve(rows).then(resolve),
    };
    return chain;
  }
  /** Имитирует подтверждённую запись и ошибку с неоднозначным результатом commit. */
  function update() {
    const chain = {
      set: (patch: Partial<typeof state.row>) => { Object.assign(state.row, patch); return chain; },
      where: () => chain,
      returning: async () => {
        if (state.fail) throw new Error('Ошибка подтверждения записи');
        return [{ ...state.row, sleepMode: state.row.defaultSleepMode }];
      },
      then: (resolve: (value: undefined) => unknown) => Promise.resolve(undefined).then(resolve),
    };
    return chain;
  }
  const tx = { select, update };
  return { db: { ...tx, transaction: async (write: (value: typeof tx) => Promise<unknown>) => write(tx) } };
});

import { readProjectForLaunch, withProjectSettingsInvalidation } from './projectSettingsCache';
import { saveProjectRuntimeDefaults } from './projectRuntimeDefaults';
import { saveProjectLaunchDefault } from './projectLaunchDefault';
import { saveProjectBotSettingDefaults } from './projectBotSettingDefaults';

/** Заполняет настоящий локальный кэш прежним снимком проекта. */
async function prime() {
  return cachedOps.getProjectCached(state.row.id, async () => ({ ...state.row }) as unknown as BotProject);
}

beforeEach(() => {
  state.row = { id: 990009, defaultSleepMode: 'process', defaultLaunchMode: 'polling', botSettingDefaults: {} };
  state.fail = false;
  cachedOps.invalidateProject(state.row.id);
});

it('после сохранения сна следующий запуск получает direct без ожидания TTL', async () => {
  await prime();
  await saveProjectRuntimeDefaults(state.row.id, { sleepMode: 'direct' });
  const cached = await prime();
  const launch = await readProjectForLaunch(state.row.id);
  expect(cached?.defaultSleepMode).toBe('direct');
  expect(resolveProjectSleepMode(launch?.defaultSleepMode, true)).toBe('direct');
});

it.each(['webhook', 'polling'] as const)('сбрасывает прежний транспорт после сохранения %s', async (mode) => {
  state.row.defaultLaunchMode = mode === 'webhook' ? 'polling' : 'webhook';
  await prime();
  await saveProjectLaunchDefault(state.row.id, mode);
  expect((await prime())?.defaultLaunchMode).toBe(mode);
  expect((await readProjectForLaunch(state.row.id))?.defaultLaunchMode).toBe(mode);
});

it('сбрасывает кэш общих настроек поведения ботов', async () => {
  await prime();
  await saveProjectBotSettingDefaults(state.row.id, { logLevel: 'DEBUG' });
  expect((await prime())?.botSettingDefaults).toMatchObject({ logLevel: 'DEBUG' });
});

it('запуск обходит устаревший кэш другого процесса записи', async () => {
  await prime();
  state.row.defaultSleepMode = 'direct';
  state.row.defaultLaunchMode = 'webhook';
  expect((await prime())?.defaultSleepMode).toBe('process');
  expect(await readProjectForLaunch(state.row.id)).toMatchObject({
    defaultSleepMode: 'direct', defaultLaunchMode: 'webhook',
  });
});

it('сбрасывает кэш и сохраняет ошибку при неоднозначном результате записи', async () => {
  await prime();
  state.fail = true;
  await expect(saveProjectRuntimeDefaults(state.row.id, { sleepMode: 'direct' })).rejects.toThrow('Ошибка подтверждения записи');
  expect((await prime())?.defaultSleepMode).toBe('direct');
});

it('инвалидирует кэш только после завершения транзакции', async () => {
  await prime();
  await withProjectSettingsInvalidation(state.row.id, async () => {
    state.row.defaultSleepMode = 'direct';
    expect((await prime())?.defaultSleepMode).toBe('process');
  });
  expect((await prime())?.defaultSleepMode).toBe('direct');
});
