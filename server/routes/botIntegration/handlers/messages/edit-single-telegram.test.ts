/** @fileoverview Проверки ответа Telegram и распознавания медиа при редактировании сообщения. */
import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  /** Ответ Telegram без реальной сети. */
  fetch: vi.fn(),
}));
vi.mock('../../../../utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../../../../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'https://example.invalid' }));
import { callTelegramEditMessage, hasMediaAttachment } from './edit-single-telegram';

describe('Редактирование Telegram', () => {
  it('не принимает HTTP 200 с ok:false за успешное изменение', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: false, description: 'Bad Request' }) });
    expect(await callTelegramEditMessage('test', '1', 2, 'Текст', false, { inline_keyboard: [] }))
      .toEqual({ success: false, error: 'Bad Request' });
  });
  it('считает идентичную правку уже выполненной', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({ ok: false, description: 'Bad Request: message is not modified' }) });
    expect(await callTelegramEditMessage('test', '1', 2, 'Текст', false, { inline_keyboard: [] }))
      .toEqual({ success: true });
  });
  it('распознаёт медиа рассылки и исключает стикеры без подписи', () => {
    expect(hasMediaAttachment({ mediaType: 'photo', mediaUrl: 'https://example.invalid/a.jpg' })).toBe(true);
    expect(hasMediaAttachment({ mediaType: 'video', mediaUrls: ['https://example.invalid/a.mp4'] })).toBe(true);
    expect(hasMediaAttachment({ photo: { file_id: 'photo-id' } })).toBe(true);
    expect(hasMediaAttachment({ mediaType: 'document' })).toBe(true);
    expect(hasMediaAttachment({ broadcastMediaType: 'photo', broadcastMediaUrl: 'https://example.invalid/broadcast.jpg' })).toBe(true);
    expect(hasMediaAttachment({ broadcastMediaType: 'sticker', broadcastMediaUrl: 'https://example.invalid/sticker.webp' })).toBe(false);
    expect(hasMediaAttachment({ mediaType: 'sticker', mediaUrl: 'sticker.webp' })).toBe(false);
    expect(hasMediaAttachment({ sticker: { file_id: 'sticker-id' } })).toBe(false);
    expect(hasMediaAttachment({ mediaUrls: [] })).toBe(false);
  });
});
