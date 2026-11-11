/** @fileoverview Проверки получения file_id аватара без запросов файла и обращения к диску. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadBotUserPhotoFileId } from './bot-user-photo-file-id';
import { readPhotoResponse } from './bot-user-photo-response';

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock('../../../../utils/telegram-proxy', () => ({ fetchWithProxy: fetchMock }));
vi.mock('../../../../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'http://127.0.0.1:8081' }));
const input = { projectId: 1, tokenId: 2, userId: '123', token: '123:abcdefghijklmnopqrstuvwxyz' };

/**
 * Создаёт JSON-ответ Telegram для проверки транспорта.
 * @param result - Результат Telegram
 * @returns Ответ сервиса
 */
function json(result: unknown): Response { return Response.json({ ok: true, result }); }

afterEach(() => { fetchMock.mockReset(); vi.useRealTimers(); });

describe('Идентификатор фотографии пользователя', () => {
  it('возвращает самый крупный вариант единственным запросом без getFile', async () => {
    fetchMock.mockResolvedValueOnce(json({ total_count: 1, photos: [[{ file_id: 'small' }, { file_id: 'large' }]] }));
    await expect(loadBotUserPhotoFileId(input)).resolves.toBe('large');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`http://127.0.0.1:8081/bot${input.token}/getUserProfilePhotos?user_id=123&limit=1`);
    expect(options.redirect).toBe('error');
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('отличает отсутствие фотографии от ошибки Telegram', async () => {
    fetchMock.mockResolvedValueOnce(json({ total_count: 0, photos: [] }));
    await expect(loadBotUserPhotoFileId(input)).resolves.toBeNull();
    fetchMock.mockResolvedValueOnce(Response.json({ ok: false }));
    await expect(loadBotUserPhotoFileId(input)).rejects.toThrow('Не удалось получить');
  });

  it('не раскрывает токен из исключения транспорта', async () => {
    fetchMock.mockRejectedValueOnce(new Error(`request failed ${input.token}`));
    await expect(loadBotUserPhotoFileId(input)).rejects.toThrow(/^Не удалось получить идентификатор фотографии пользователя$/);
  });

  it.each(['https://example.com/x', '../photo', '', 'a'.repeat(2049)])('отклоняет некорректный идентификатор %s', async fileId => {
    fetchMock.mockResolvedValueOnce(json({ total_count: 1, photos: [[{ file_id: fileId }]] }));
    await expect(loadBotUserPhotoFileId(input)).rejects.toThrow();
  });

  it('не трактует повреждённый результат как отсутствие фотографии', async () => {
    fetchMock.mockResolvedValueOnce(json({ photos: [] }));
    await expect(loadBotUserPhotoFileId(input)).rejects.toThrow();
  });

  it('ограничивает фактический размер JSON без content-length', async () => {
    fetchMock.mockResolvedValueOnce(new Response(' '.repeat(256 * 1024 + 1)));
    await expect(loadBotUserPhotoFileId(input)).rejects.toThrow();
  });

  it('отклоняет превышение размера до чтения тела', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({ cancel });
    await expect(readPhotoResponse(new Response(body, { headers: { 'content-length': '2048' } }), 1024, new AbortController().signal)).rejects.toThrow();
    expect(cancel).toHaveBeenCalled();
  });

  it('общий срок прерывает зависшее тело ответа', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(new Response(new ReadableStream()));
    const settled = expect(loadBotUserPhotoFileId(input)).rejects.toThrow('Не удалось получить');
    await vi.advanceTimersByTimeAsync(10_000);
    await settled;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it.each([{ userId: '../1' }, { tokenId: -1 }, { projectId: 0 }, { token: 'invalid' }])('не обращается к сети при некорректных параметрах %j', async change => {
    await expect(loadBotUserPhotoFileId({ ...input, ...change })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
