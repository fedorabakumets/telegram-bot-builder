/** @fileoverview Проверки потоковой передачи Range, отмены транспорта и безопасных ответов прокси. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
const transport = vi.hoisted(() => vi.fn());
vi.mock('../../../../utils/telegram-proxy', () => ({ fetchWithProxy: transport }));
vi.mock('../../../../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'https://api.telegram.org' }));
import { streamTelegramFile } from './telegram-file-stream';
const servers: Server[] = [];
const token = `123:${'a'.repeat(30)}`;
/** Поднимает настоящий локальный HTTP-поток для проверки заголовков и тела.
 * @returns Адрес тестового маршрута.
 */
async function start(options: { /** Предел байтов. */ maxBytes?: number; /** Срок передачи. */ timeoutMs?: number } = {}): Promise<string> {
  const app = express();
  app.get('/file', (req, res) => { void streamTelegramFile(req, res, { token, fileId: 'file', ...options }); });
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  return `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/file`;
}
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  transport.mockReset();
});
describe('потоковый Telegram-прокси', () => {
  it('сохраняет 206, Range и приватный кэш без буферизации файла', async () => {
    transport.mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'videos/file.mp4' } }))
      .mockResolvedValueOnce(new Response('abc', { status: 206, headers: { 'content-range': 'bytes 0-2/9', 'content-length': '3' } }));
    const response = await fetch(await start(), { headers: { Range: 'bytes=0-2' } });
    expect(response.status).toBe(206);
    expect(await response.text()).toBe('abc');
    expect(response.headers.get('content-range')).toBe('bytes 0-2/9');
    expect(response.headers.get('cache-control')).toBe('private, max-age=86400');
    expect(response.headers.get('vary')).toBe('Cookie, Authorization');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(transport.mock.calls[1][1]).toMatchObject({ headers: { Range: 'bytes=0-2' }, redirect: 'error' });
    expect(transport.mock.calls[0][1].redirect).toBe('error');
  });
  it('сохраняет 416 для невыполнимого диапазона', async () => {
    transport.mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'videos/file.mp4' } }))
      .mockResolvedValueOnce(new Response('', { status: 416, headers: { 'content-range': 'bytes */9' } }));
    const response = await fetch(await start());
    expect(response.status).toBe(416);
    expect(response.headers.get('content-range')).toBe('bytes */9');
    expect(response.headers.get('cache-control')).toBeNull();
  });
  it('отмена клиента прерывает ожидающий транспорт', async () => {
    let upstreamSignal: AbortSignal | undefined;
    transport.mockImplementation((_url, options) => {
      upstreamSignal = options.signal;
      return new Promise((_resolve, reject) => upstreamSignal!.addEventListener('abort', () => reject(new Error('отмена'))));
    });
    const controller = new AbortController();
    const request = fetch(await start(), { signal: controller.signal }).catch(() => null);
    await vi.waitFor(() => expect(upstreamSignal).toBeDefined());
    controller.abort();
    await request;
    await vi.waitFor(() => expect(upstreamSignal!.aborted).toBe(true));
  });
  it('не раскрывает секрет из ошибки транспорта', async () => {
    transport.mockRejectedValue(new Error(`https://api.telegram.org/bot${token}/getFile`));
    const response = await fetch(await start());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain(token);
  });
  it('проверяет объявленный размер аватара до отправки успешных заголовков', async () => {
    transport.mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'photos/file.jpg' } }))
      .mockResolvedValueOnce(new Response('large', { headers: { 'content-length': '5' } }));
    const response = await fetch(await start({ maxBytes: 3 }));
    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBeNull();
  });
  it('ограничивает реальные байты аватара без content-length', async () => {
    transport.mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'photos/file.jpg' } }))
      .mockResolvedValueOnce(new Response('large'));
    await expect(fetch(await start({ maxBytes: 3 })).then(response => response.text())).rejects.toThrow();
  });
  it('общий срок аватара прерывает зависший getFile', async () => {
    transport.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('отмена')));
    }));
    const response = await fetch(await start({ timeoutMs: 20 }));
    expect(response.status).toBe(504);
  });
  it.each(['text/html', 'image/svg+xml', 'application/xhtml+xml', 'application/octet-stream'])('изолирует активный или неизвестный MIME %s', async contentType => {
    transport.mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'documents/file' } }))
      .mockResolvedValueOnce(new Response('payload', { headers: { 'content-type': contentType } }));
    const response = await fetch(await start());
    expect(response.headers.get('content-disposition')).toMatch(/^attachment;/);
    expect(response.headers.get('content-security-policy')).toBe("sandbox; default-src 'none'");
    expect(await response.text()).toBe('payload');
  });
});
