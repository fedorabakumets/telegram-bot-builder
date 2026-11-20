/** @fileoverview Проверка постепенного чтения результатов, границ UTF-8 и прерывания потока. */
import { afterEach, expect, it, vi } from 'vitest';
import { ReadableStream } from 'node:stream/web';
import { TextEncoder, TextDecoder } from 'node:util';
import { streamTelegramBotCheck } from './stream-telegram-bot-check';
const encoder = new TextEncoder();
afterEach(() => vi.unstubAllGlobals());
/** Строка протокола содержит только публичные итоги выбранной области. */
function event(type: string, items: unknown[]) { return JSON.stringify({ type, total: 2, result: { items, available: items.length, unavailable: 0, errors: 0 } }) + '\n'; }
/** Обновление приходит до закрытия потока, а не после полного ответа HTTP. */
it('показывает первый результат до завершения второго', async () => {
  let output!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(controller) { output = controller; } });
  vi.stubGlobal('TextDecoder', TextDecoder);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body }));
  const progress = vi.fn();
  const result = streamTelegramBotCheck(12, null, progress, new AbortController().signal);
  const first = { tokenId: 9, status: 'available', name: 'Первый бот' };
  const bytes = encoder.encode(event('progress', [first]));
  for (const byte of bytes) output.enqueue(Uint8Array.of(byte));
  await vi.waitFor(() => expect(progress).toHaveBeenCalledOnce());
  expect(progress.mock.calls[0][0].items[0].name).toBe('Первый бот');
  output.enqueue(encoder.encode(event('complete', [first, { tokenId: 10, status: 'available' }]))); output.close();
  expect((await result).items).toHaveLength(2);
  expect(progress).toHaveBeenCalledTimes(2);
});
/** Потеря соединения не выдаёт частичный ответ за успешно завершённую проверку. */
it('сохраняет промежуточное событие и сообщает о незавершённом потоке', async () => {
  const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(encoder.encode(event('progress', [{ tokenId: 9, status: 'available' }]))); controller.close(); } });
  vi.stubGlobal('TextDecoder', TextDecoder); vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body }));
  const progress = vi.fn();
  await expect(streamTelegramBotCheck(12, null, progress, new AbortController().signal)).rejects.toThrow('Соединение прервалось');
  expect(progress).toHaveBeenCalledOnce();
});
