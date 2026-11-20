/** @fileoverview Проверка API общих настроек сна и восстановления ботов. */

import type { Request, Response } from 'express';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), broadcast: vi.fn() }));
vi.mock('../../../bots/projectRuntimeDefaults', () => ({
  getProjectRuntimeDefaults: mocks.read,
  saveProjectRuntimeDefaults: mocks.save,
}));
vi.mock('../../../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));

import { handleProjectRuntimeDefaults } from './projectRuntimeDefaultsHandler';

/**
 * Передаёт запрос в обработчик без подключения к приложению и базе.
 * @param method - Метод запроса.
 * @param body - Тело запроса.
 * @returns Код и тело ответа.
 */
async function request(method: string, body?: unknown) {
  const result = { code: 200, body: undefined as unknown };
  const res = {
    set() { return this; },
    status(code: number) { result.code = code; return this; },
    json(value: unknown) { result.body = value; return this; },
  };
  await handleProjectRuntimeDefaults({ method, body, params: { projectId: '10' } } as unknown as Request, res as unknown as Response);
  return result;
}

beforeEach(() => {
  mocks.read.mockReset();
  mocks.save.mockReset();
  mocks.broadcast.mockReset().mockResolvedValue(undefined);
});

it('показывает включённый сон для старого проекта без явной настройки', async () => {
  const saved = { sleepMode: null, autoRestart: 0, maxRestartAttempts: 3 };
  mocks.read.mockResolvedValue(saved);
  expect(await request('GET')).toEqual({ code: 200, body: { ...saved, sleepMode: 'process' } });
  expect(mocks.read).toHaveBeenCalledWith(10);
  expect(mocks.save).not.toHaveBeenCalled();
});

it.each([{ sleepMode: null }, { sleepMode: 'direct' }, { autoRestart: 0 }, { maxRestartAttempts: 10 }])(
  'передаёт частичное изменение %o с исходным значением', async (patch) => {
    const settings = { sleepMode: 'process', autoRestart: 1, maxRestartAttempts: 3, ...patch };
    mocks.save.mockResolvedValue(settings);
    expect(await request('PUT', patch)).toEqual({ code: 200, body: { ...settings, sleepMode: settings.sleepMode ?? 'process' } });
    expect(mocks.save).toHaveBeenCalledWith(10, patch);
  },
);

it.each([{ sleepMode: 'invalid' }, { autoRestart: 2 }, { maxRestartAttempts: 0 }, { maxRestartAttempts: 11 }, { restart: true }])(
  'отклоняет некорректную настройку %o до записи', async (patch) => {
    expect((await request('PUT', patch)).code).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  },
);
