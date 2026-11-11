/** @fileoverview Проверки ограничений транспорта фотографий и атомарного сохранения. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadBotUserPhoto, getBotUserPhotoLocation } from './bot-user-photo-download';
import { encodePhotoFilePath, readPhotoResponse } from './bot-user-photo-response';

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock('../../../../utils/telegram-proxy', () => ({ fetchWithProxy: fetchMock }));
vi.mock('../../../../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'http://127.0.0.1:8081' }));
const input = { projectId: 1, tokenId: 2, userId: '123', token: '123:abcdefghijklmnopqrstuvwxyz' };
let directory: string | undefined;

/** Создаёт JSON-ответ Telegram для проверки транспорта. */
function json(result: unknown): Response { return Response.json({ ok: true, result }); }

afterEach(async () => {
  vi.restoreAllMocks();
  fetchMock.mockReset();
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = undefined;
});

describe('Транспорт фотографий пользователей', () => {
  it('изолирует проекты, токены и смену учётных данных', () => {
    const original = getBotUserPhotoLocation(input).url;
    for (const change of [{ projectId: 2 }, { tokenId: 3 }, { userId: '124' }, { token: '123:abcdefghijklmnopqrstuvwxyZ' }]) {
      expect(getBotUserPhotoLocation({ ...input, ...change }).url).not.toBe(original);
    }
    expect(original).not.toContain(input.token);
  });

  it.each(['../x', '/etc/passwd', 'https://other/x', 'a/../b', 'a/%2e%2e/b', 'a\\b', 'a?b', 'a//b'])('отклоняет опасный путь %s', path => {
    expect(() => encodePhotoFilePath(path)).toThrow();
  });

  it('отличает отсутствие фотографии от ошибки Telegram', async () => {
    fetchMock.mockResolvedValueOnce(json({ total_count: 0, photos: [] }));
    await expect(loadBotUserPhoto(input)).resolves.toBeNull();
    fetchMock.mockResolvedValueOnce(Response.json({ ok: false }));
    await expect(loadBotUserPhoto(input)).rejects.toThrow('Не удалось загрузить');
  });

  it('не раскрывает токен из исключения транспорта', async () => {
    fetchMock.mockRejectedValueOnce(new Error(`request failed ${input.token}`));
    await expect(loadBotUserPhoto(input)).rejects.toThrow(/^Не удалось загрузить фотографию пользователя$/);
  });

  it('ограничивает фактический размер тела без content-length', async () => {
    await expect(readPhotoResponse(new Response('12345'), 4, new AbortController().signal)).rejects.toThrow();
  });

  it('прерывает зависшее тело по общему сигналу', async () => {
    const controller = new AbortController();
    const response = new Response(new ReadableStream());
    const reading = readPhotoResponse(response, 1024, controller.signal);
    controller.abort();
    await expect(reading).rejects.toThrow();
  });

  it('сохраняет атомарно и использует единый сигнал и настроенный локальный API', async () => {
    directory = await mkdtemp(join(tmpdir(), 'bot-photo-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    fetchMock.mockResolvedValueOnce(json({ total_count: 1, photos: [[{ file_id: 'x&y' }]] }))
      .mockResolvedValueOnce(json({ file_path: 'photos/avatar.jpg' }))
      .mockResolvedValueOnce(new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])));
    await expect(loadBotUserPhoto(input)).resolves.toBe(getBotUserPhotoLocation(input).url);
    const location = getBotUserPhotoLocation(input);
    expect(await readFile(location.path)).toEqual(Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
    expect(await readdir(join(directory, 'uploads', '1', 'user_photos'))).toHaveLength(1);
    expect(fetchMock.mock.calls[1][0]).toContain('file_id=x%26y');
    for (const [url, options] of fetchMock.mock.calls) {
      expect(url).toMatch(/^http:\/\/127\.0\.0\.1:8081\//);
      expect(options.signal).toBe(fetchMock.mock.calls[0][1].signal);
      expect(options.redirect).toBe('error');
    }
  });

  it('не обращается к сети при некорректных идентификаторах', async () => {
    await expect(loadBotUserPhoto({ ...input, userId: '../1' })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('отклоняет HTML вместо фотографии', async () => {
    fetchMock.mockResolvedValueOnce(json({ total_count: 1, photos: [[{ file_id: 'x' }]] }))
      .mockResolvedValueOnce(json({ file_path: 'photos/avatar.jpg' }))
      .mockResolvedValueOnce(new Response('<html>error</html>'));
    await expect(loadBotUserPhoto(input)).rejects.toThrow('Не удалось загрузить');
  });
});
