/** @fileoverview Проверки API наследуемых настроек проекта без подключения к базе данных. */

import type { Request, Response } from 'express';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), broadcast: vi.fn(), Conflict: class extends Error {} }));
vi.mock('../../../bots/projectBotSettingDefaults', () => ({
  getProjectBotSettingDefaults: mocks.read,
  saveProjectBotSettingDefaults: mocks.save,
  ProjectBotSettingDefaultsConflict: mocks.Conflict,
}));
vi.mock('../../../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));

import { handleProjectBotSettingDefaults } from './projectBotSettingDefaultsHandler';

/**
 * Передаёт запрос в обработчик без поднятия сервера.
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
  await handleProjectBotSettingDefaults({ method, body, params: { projectId: '10' } } as Request, res as unknown as Response);
  return result;
}

beforeEach(() => {
  mocks.read.mockReset();
  mocks.save.mockReset();
  mocks.broadcast.mockReset().mockResolvedValue(undefined);
});

it('показывает настройки указанного проекта без записи и оповещения', async () => {
  const saved = { messagesRetentionDays: 30, webhookBaseUrl: null, logLevel: 'INFO' };
  mocks.read.mockResolvedValue(saved);
  expect(await request('GET')).toEqual({ code: 200, body: saved });
  expect(mocks.read).toHaveBeenCalledWith(10);
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.broadcast).not.toHaveBeenCalled();
});

it('сохраняет нулевые значения и публикует одно оповещение после записи', async () => {
  const patch = { messagesRetentionDays: 0, protectContent: 0, webhookBaseUrl: null };
  mocks.save.mockResolvedValue(patch);
  expect(await request('PUT', patch)).toEqual({ code: 200, body: patch });
  expect(mocks.save).toHaveBeenCalledWith(10, patch);
  expect(mocks.broadcast).toHaveBeenCalledOnce();
  expect(mocks.broadcast).toHaveBeenCalledWith(10, expect.objectContaining({ type: 'project-bot-settings-updated' }));
});

it.each([{ messagesRetentionDays: 15 }, { logLevel: 'TRACE' }, { protectContent: 2 },
  { webhookBaseUrl: 'http://example.com' }, { webhookBaseUrl: 'https://alice:secret@example.com' }, { autoRestart: 1 }])(
  'отклоняет неподдерживаемое изменение %o до записи', async (patch) => {
    expect((await request('PUT', patch)).code).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  },
);

it('отклоняет несовместимый webhook без события об изменении', async () => {
  const message = 'Для webhook укажите публичный адрес';
  mocks.save.mockRejectedValue(new mocks.Conflict(message));
  expect(await request('PUT', { webhookBaseUrl: null })).toEqual({ code: 409, body: { message } });
  expect(mocks.broadcast).not.toHaveBeenCalled();
});
