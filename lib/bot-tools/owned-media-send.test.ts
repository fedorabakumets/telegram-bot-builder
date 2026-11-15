/** @fileoverview Регрессии отправки вложений S3 без локальной копии и безопасного закрытия оригиналов. */
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertOwnedMediaAvailable, readOwnedMediaBuffer } from '../../server/routes/botIntegration/handlers/messages/owned-media-content';
import { sendTelegramMessage } from '../../server/routes/botIntegration/handlers/messages/send-telegram-message';
import { sendTelegramMediaGroup } from '../../server/routes/botIntegration/handlers/messages/send-telegram-media-group';

/** Подмены границ хранилища и Telegram, исключающие реальную отправку. */
const mocks = vi.hoisted(() => ({ resolve: vi.fn(), open: vi.fn(), fetch: vi.fn(), close: vi.fn(), stream: vi.fn() }));
vi.mock('../../server/storage/resolve-runtime-media', () => ({ resolveRuntimeMedia: mocks.resolve, openRuntimeMedia: mocks.open }));
vi.mock('../../server/utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../../server/routes/botIntegration/handlers/messages/telegram-message-limiter', () => ({ waitForTelegramMessages: vi.fn() }));
vi.mock('../../server/storages/storage', () => ({ storage: {} }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.resolve.mockImplementation(async (projectId, url) => ({ media: { projectId, url, storageBackend: 's3' }, backend: { configId: 's3-one' } }));
  mocks.stream.mockImplementation(async () => Readable.from([Buffer.from('original-image')]));
  mocks.open.mockImplementation(async () => ({ size: 14, version: 'v1', stream: mocks.stream, close: mocks.close }));
  mocks.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 1 } }) });
});

describe('Вложение из зарегистрированного хранилища', () => {
  it('проверяет существование без скачивания и закрывает локальный дескриптор', async () => {
    await assertOwnedMediaAvailable('/uploads/9/a.jpg', 9);
    expect(mocks.resolve).toHaveBeenCalledWith(9, '/uploads/9/a.jpg');
    expect(mocks.open).toHaveBeenCalledWith(expect.objectContaining({ backend: { configId: 's3-one' } }));
    expect(mocks.stream).not.toHaveBeenCalled();
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });
  it('читает оригинал S3 без close и без локального файла', async () => {
    mocks.open.mockResolvedValue({ size: 14, version: 's3-etag', stream: mocks.stream });
    const result = await readOwnedMediaBuffer('uploads/9/a.jpg', 9);
    expect(result.fileName).toBe('a.jpg');
    expect(result.buffer.toString()).toBe('original-image');
    expect(mocks.resolve).toHaveBeenCalledWith(9, '/uploads/9/a.jpg');
  });
  it.each([
    ['/uploads/10/a.jpg', 9], ['/uploads/9/../secret', 9], ['/uploads/9/%2e%2e/secret', 9],
    ['/uploads/9/a.jpg', undefined], ['/uploads/9/a.jpg', 0], ['/uploads/9/a.jpg?secret', 9],
  ])('отклоняет путь %s до открытия оригинала', async (url, projectId) => {
    await expect(readOwnedMediaBuffer(url as string, projectId as number)).rejects.toThrow();
    expect(mocks.resolve).not.toHaveBeenCalled();
    expect(mocks.open).not.toHaveBeenCalled();
  });
  it('передаёт отказ владения и не открывает чужую запись', async () => {
    mocks.resolve.mockRejectedValue(new Error('Медиафайл не найден'));
    await expect(readOwnedMediaBuffer('/uploads/9/a.jpg', 9)).rejects.toThrow('Медиафайл не найден');
    expect(mocks.open).not.toHaveBeenCalled();
  });
  it('закрывает оригинал при ошибке получения потока', async () => {
    mocks.stream.mockRejectedValue(new Error('S3 недоступен'));
    await expect(readOwnedMediaBuffer('/uploads/9/a.jpg', 9)).rejects.toThrow('S3 недоступен');
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });
  it('сохраняет прочитанные байты после автоматического закрытия дескриптора потоком Linux', async () => {
    mocks.close.mockRejectedValue(Object.assign(new Error('Дескриптор уже закрыт'), { code: 'EBADF' }));
    expect((await readOwnedMediaBuffer('/uploads/9/a.jpg', 9)).buffer.toString()).toBe('original-image');
  });
});

describe('Отправка Telegram через multipart', () => {
  it('отправляет одиночную фотографию из S3 с подписью и кнопкой', async () => {
    await sendTelegramMessage('test-token', '123', 'Подпись', [{ id: 1, type: 'photo', url: '/uploads/9/a.jpg' }],
      [{ id: 'go', text: 'Открыть', url: 'https://example.org' }], true, undefined, 9);
    const [url, request] = mocks.fetch.mock.calls[0];
    const body = Buffer.from(request.body).toString();
    expect(url).toContain('/sendPhoto');
    expect(request.headers['Content-Type']).toContain('multipart/form-data');
    expect(body).toContain('filename="a.jpg"');
    expect(body).toContain('original-image');
    expect(body).toContain('Подпись');
    expect(body).toContain('https://example.org');
  });
  it('отправляет альбом из S3 с обоими оригиналами', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true, result: [{ message_id: 2 }] }) });
    const result = await sendTelegramMediaGroup('test-token', '123', 'Альбом', [
      { id: 1, type: 'photo', url: '/uploads/9/a.jpg' }, { id: 2, type: 'photo', url: '/uploads/9/b.jpg' },
    ], true, 9);
    const [url, request] = mocks.fetch.mock.calls[0];
    const body = Buffer.from(request.body).toString();
    expect(url).toContain('/sendMediaGroup');
    expect(body).toContain('filename="a.jpg"');
    expect(body).toContain('filename="b.jpg"');
    expect(body.match(/original-image/g)).toHaveLength(2);
    expect(result.result?.message_id).toBe(2);
  });
  it('не обращается в Telegram при недоступном объекте S3', async () => {
    mocks.open.mockRejectedValue(new Error('Объект не найден'));
    await expect(sendTelegramMessage('test-token', '123', '', [{ id: 1, type: 'photo', url: '/uploads/9/a.jpg' }], [], true, undefined, 9))
      .rejects.toThrow('Объект не найден');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
