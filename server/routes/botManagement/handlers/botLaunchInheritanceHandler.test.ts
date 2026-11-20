/** @fileoverview Проверка выбора ботов для массового включения наследования. */

import type { Request, Response } from 'express';
import { beforeEach, expect, it, vi } from 'vitest';

/** Раздельные заглушки для двух вариантов наследования и уведомлений. */
const mocks = vi.hoisted(() => ({ adopt: vi.fn(), adoptAutoRestart: vi.fn(), emit: vi.fn(), broadcast: vi.fn(),
  ValidationError: class extends Error {},
}));
vi.mock('../../../bots/adoptProjectLaunchMode', () => ({ adoptProjectLaunchMode: mocks.adopt }));
vi.mock('../../../bots/saveBotAutoRestartSettings', () => ({ adoptProjectAutoRestart: mocks.adoptAutoRestart }));
vi.mock('../../../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));
vi.mock('../../../terminal/emitTokenUpdated', () => ({ emitTokenUpdated: mocks.emit }));
vi.mock('../../../bots/runtimeModePolicy', () => ({ RuntimeModeValidationError: mocks.ValidationError }));

import { handleBotLaunchInheritance } from './botLaunchInheritanceHandler';

/**
 * Вызывает обработчик для выбранных ботов проекта.
 * @param tokenIds - Значение списка идентификаторов из запроса.
 * @param setting - Отдельная настройка для массового наследования.
 * @returns Код и содержимое ответа.
 */
async function request(tokenIds: unknown, setting?: 'all' | 'auto-restart' | 'sleep') {
  const result = { code: 200, body: undefined as unknown };
  const res = {
    set() { return this; },
    status(code: number) { result.code = code; return this; },
    json(value: unknown) { result.body = value; return this; },
  };
  await handleBotLaunchInheritance({ method: 'PUT', params: { projectId: '10' }, body: { tokenIds, setting } } as Request,
    res as unknown as Response);
  return result;
}

beforeEach(() => {
  mocks.adopt.mockReset();
  mocks.adoptAutoRestart.mockReset();
  mocks.broadcast.mockReset().mockResolvedValue(undefined);
  mocks.emit.mockReset().mockResolvedValue(undefined);
});

it('переводит выбранных ботов только на общий автоперезапуск и посылает одно оповещение', async () => {
  mocks.adoptAutoRestart.mockResolvedValue([6, 64]);
  expect(await request([6, 64], 'auto-restart')).toEqual({ code: 200, body: { inheritedCount: 2 } });
  expect(mocks.adoptAutoRestart).toHaveBeenCalledWith(10, [6, 64]);
  expect(mocks.adopt).not.toHaveBeenCalled();
  expect(mocks.broadcast).toHaveBeenCalledOnce();
  expect(mocks.emit).not.toHaveBeenCalled();
});

it('переводит выбранных ботов на все настройки одним вызовом и оповещает проект', async () => {
  mocks.adopt.mockResolvedValue([6, 64]);
  expect(await request([6, 6, 64], 'all')).toEqual({ code: 200, body: { inheritedCount: 2 } });
  expect(mocks.adopt).toHaveBeenCalledOnce();
  expect(mocks.adopt).toHaveBeenCalledWith(10, [6, 64], 'all');
  expect(mocks.adoptAutoRestart).not.toHaveBeenCalled();
  expect(mocks.broadcast).toHaveBeenCalledOnce();
  expect(mocks.broadcast).toHaveBeenCalledWith(10, expect.objectContaining({ type: 'project-runtime-defaults-updated' }));
  expect(mocks.emit).not.toHaveBeenCalled();
});

it('возвращает причину несовместимости и не оповещает проект о неудачной записи', async () => {
  const message = 'Для webhook нужен публичный адрес';
  mocks.adopt.mockRejectedValue(new mocks.ValidationError(message));
  expect(await request([6], 'all')).toEqual({ code: 400, body: { message } });
  expect(mocks.broadcast).not.toHaveBeenCalled();
  expect(mocks.emit).not.toHaveBeenCalled();
});

it('удаляет повторы и оповещает только об изменившихся ботах', async () => {
  mocks.adopt.mockResolvedValue([6]);
  expect(await request([6, 6, 64])).toEqual({ code: 200, body: { inheritedCount: 1 } });
  expect(mocks.adopt).toHaveBeenCalledWith(10, [6, 64]);
  expect(mocks.emit).toHaveBeenCalledOnce();
  expect(mocks.emit).toHaveBeenCalledWith(expect.objectContaining({ projectId: 10, tokenId: 6 }));
});

it('отклоняет список с ботом из другого проекта без оповещений', async () => {
  mocks.adopt.mockResolvedValue(null);
  expect((await request([6, 64])).code).toBe(404);
  expect(mocks.emit).not.toHaveBeenCalled();
});

it('отклоняет пустой выбор и дробные идентификаторы до обращения к хранилищу', async () => {
  expect((await request([])).code).toBe(400);
  expect((await request([6.5])).code).toBe(400);
  expect((await request([6], 'sleep')).code).toBe(400);
  expect(mocks.adopt).not.toHaveBeenCalled();
});
