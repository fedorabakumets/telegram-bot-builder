/**
 * @fileoverview Проверка обработки недоступного аватара бота
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  end: vi.fn(),
  fetch: vi.fn(),
  tokens: vi.fn(),
  resolve: vi.fn(),
}));

vi.mock('pg', () => ({ Pool: class {
  /** Выполняет запрос к тестовой базе. */
  query = mocks.query;
  /** Закрывает тестовый пул. */
  end = mocks.end;
} }));
vi.mock('../../server/storages/storage', () => ({ storage: { getBotTokensByProject: mocks.tokens } }));
vi.mock('../../server/utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../../server/routes/utils/resolve-request-token', () => ({
  getRequestTokenId: () => undefined,
  resolveProjectBotToken: mocks.resolve,
}));

import { getAvatarHandler } from '../../server/routes/botIntegration/handlers/botData/getAvatarHandler';
import type { Request, Response } from 'express';

describe('аватар бота при ошибке Telegram', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.tokens.mockResolvedValue([]);
    mocks.resolve.mockResolvedValue({ id: 1, token: '123:token' });
    mocks.query.mockResolvedValue({ rows: [{ bot_photo_url: 'AgAC_file_id' }] });
    mocks.end.mockResolvedValue(undefined);
  });

  it.each([
    ['getMe недоступен', [{ ok: false }, { ok: false }]],
    ['свежий файл недоступен', [
      { ok: false },
      { ok: true, result: { id: 123 } },
      { ok: true, result: { total_count: 1, photos: [[{ file_id: 'fresh_id' }]] } },
      { ok: false },
    ]],
  ])('возвращает 404, когда %s', async (_case, replies) => {
    for (const reply of replies) {
      mocks.fetch.mockResolvedValueOnce({ ok: reply.ok, json: async () => reply });
    }
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await getAvatarHandler({ params: { projectId: '1', userId: 'bot' } } as unknown as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mocks.fetch).not.toHaveBeenCalledWith('AgAC_file_id');
    expect(mocks.fetch).toHaveBeenCalledTimes(replies.length);
    expect(mocks.end).toHaveBeenCalledOnce();
  });

  it('загружает файл, когда Telegram возвращает путь', async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ result: { file_path: 'photos/avatar.jpg' } }) });
    mocks.fetch.mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'image/jpeg' }), arrayBuffer: async () => new Uint8Array([1, 2]).buffer });
    const res = { set: vi.fn(), removeHeader: vi.fn(), send: vi.fn() };
    await getAvatarHandler({ params: { projectId: '1', userId: 'bot' } } as unknown as Request, res as unknown as Response);

    expect(mocks.fetch).toHaveBeenLastCalledWith('https://api.telegram.org/file/bot123:token/photos/avatar.jpg');
    expect(res.send).toHaveBeenCalledWith(Buffer.from([1, 2]));
  });
});
