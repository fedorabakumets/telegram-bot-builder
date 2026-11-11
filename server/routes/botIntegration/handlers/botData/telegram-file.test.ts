/** @fileoverview Узкие проверки параметров, изоляции токена и метаданных Telegram-прокси. */
import { describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
const mocks = vi.hoisted(() => ({ getBotToken: vi.fn(), getDefaultBotToken: vi.fn() }));
vi.mock('../../../../storages/storage', () => ({ storage: mocks }));
import { parseTelegramFileRequest, resolveTelegramFileToken } from './telegram-file-request';
import { readTelegramFilePath } from './telegram-file-response';
/** Создаёт запрос с минимальным набором параметров.
 * @param tokenId - Необязательное значение токена.
 * @returns Запрос прокси.
 */
function request(tokenId?: unknown): Request {
  return { params: { projectId: '1' }, query: { fileId: 'file', ...(tokenId === undefined ? {} : { tokenId }) } } as unknown as Request;
}
describe('изоляция токена Telegram-прокси', () => {
  it.each(['', '0', '-1', '2x', '2.5', ['2'], {}, '9007199254740993'])('отклоняет неверный tokenId %j', value => {
    expect(parseTelegramFileRequest(request(value))).toBeNull();
  });
  it('сохраняет выбор по умолчанию только при отсутствии tokenId', async () => {
    mocks.getDefaultBotToken.mockResolvedValue({ id: 3, projectId: 1 });
    expect(await resolveTelegramFileToken(parseTelegramFileRequest(request())!)).toEqual({ id: 3, projectId: 1 });
  });
  it.each([undefined, { id: 2, projectId: 9 }])('не подменяет отсутствующий или чужой токен', async selected => {
    mocks.getDefaultBotToken.mockClear(); mocks.getBotToken.mockResolvedValue(selected);
    expect(await resolveTelegramFileToken(parseTelegramFileRequest(request('2'))!)).toBeUndefined();
    expect(mocks.getDefaultBotToken).not.toHaveBeenCalled();
  });
});
describe('ограничение метаданных Telegram', () => {
  it.each(['../secret', '/root/file', 'photos/../../file', 'https://evil/file', 'photos/%2e%2e/a', 'photos\\a'])('отклоняет путь %s', async path => {
    await expect(readTelegramFilePath(Response.json({ ok: true, result: { file_path: path } }), new AbortController().signal)).rejects.toThrow();
  });
  it('принимает относительный путь Telegram', async () => {
    await expect(readTelegramFilePath(Response.json({ ok: true, result: { file_path: 'photos/file_123.jpg' } }), new AbortController().signal)).resolves.toBe('photos/file_123.jpg');
  });
  it('ограничивает размер тела без content-length', async () => {
    await expect(readTelegramFilePath(new Response('x'.repeat(262145)), new AbortController().signal)).rejects.toThrow();
  });
  it('прерывает зависшее чтение тела', async () => {
    const controller = new AbortController();
    const reading = readTelegramFilePath(new Response(new ReadableStream()), controller.signal);
    controller.abort();
    await expect(reading).rejects.toThrow();
  });
});
