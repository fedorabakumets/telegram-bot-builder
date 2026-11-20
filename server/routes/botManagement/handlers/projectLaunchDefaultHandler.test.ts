/** @fileoverview Проверка API общего режима запуска без изменения реальных проектов. */

import type { Request, Response } from 'express';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  save: vi.fn(),
  broadcast: vi.fn(),
  Conflict: class extends Error {},
}));
vi.mock('../../../bots/projectLaunchDefault', () => ({
  getProjectLaunchDefault: mocks.read,
  saveProjectLaunchDefault: mocks.save,
  ProjectLaunchDefaultConflict: mocks.Conflict,
}));
vi.mock('../../../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));

import { handleProjectLaunchDefault } from './projectLaunchDefaultHandler';

/**
 * Вызывает обработчик на изолированных запросе и ответе.
 * @param method - Метод запроса.
 * @param projectId - Идентификатор проекта из маршрута.
 * @param body - Тело запроса.
 * @returns Код и содержимое ответа.
 */
async function request(method: string, projectId: string, body?: unknown) {
  const result = { code: 200, body: undefined as unknown };
  const res = {
    set() { return this; },
    status(code: number) { result.code = code; return this; },
    json(value: unknown) { result.body = value; return this; },
  };
  await handleProjectLaunchDefault({ method, params: { projectId }, body } as Request, res as unknown as Response);
  return result;
}

beforeEach(() => {
  mocks.read.mockReset();
  mocks.save.mockReset();
  mocks.broadcast.mockReset().mockResolvedValue(undefined);
});

it('показывает число наследующих ботов и ботов с ручным режимом', async () => {
  const settings = { launchMode: 'webhook', inheritedCount: 99, overrideCount: 1 };
  mocks.read.mockResolvedValue(settings);
  expect(await request('GET', '10')).toEqual({ code: 200, body: settings });
  expect(mocks.read).toHaveBeenCalledWith(10);
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.broadcast).not.toHaveBeenCalled();
});

it('передаёт запись только для указанного проекта и возвращает сохранённый режим', async () => {
  const settings = { launchMode: 'polling', inheritedCount: 3, overrideCount: 2 };
  mocks.save.mockResolvedValue(settings);
  expect(await request('PUT', '42', { launchMode: 'polling' })).toEqual({ code: 200, body: settings });
  expect(mocks.save).toHaveBeenCalledOnce();
  expect(mocks.save).toHaveBeenCalledWith(42, 'polling');
  expect(mocks.broadcast).toHaveBeenCalledOnce();
  expect(mocks.broadcast).toHaveBeenCalledWith(42, expect.objectContaining({ type: 'project-launch-default-updated', projectId: 42 }));
});

it('отклоняет недопустимый режим до записи', async () => {
  expect((await request('PUT', '10', { launchMode: 'inherit' })).code).toBe(400);
  expect(mocks.save).not.toHaveBeenCalled();
});

it('возвращает конфликт для несовместимой конфигурации наследующих ботов', async () => {
  mocks.save.mockRejectedValue(new mocks.Conflict('Бот использует несовместимый режим обработчика'));
  expect((await request('PUT', '10', { launchMode: 'webhook' })).code).toBe(409);
  expect(mocks.broadcast).not.toHaveBeenCalled();
});
