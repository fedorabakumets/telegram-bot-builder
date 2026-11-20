/** @fileoverview Проверка отправки медиа и клавиатуры без обращения к Telegram. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./media-reference-security', () => ({ assertRemoteMediaReference: vi.fn() }));
vi.mock('./owned-media-content', () => ({ assertOwnedMediaAvailable: vi.fn(), readOwnedMediaBuffer: vi.fn() }));
vi.mock('./telegram-message-limiter', () => ({ waitForTelegramMessages: vi.fn() }));
vi.mock('../../../../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'https://telegram.invalid' }));
vi.mock('../../../../utils/telegram-proxy', () => ({ fetchWithProxy: vi.fn() }));

import { fetchWithProxy } from '../../../../utils/telegram-proxy';
import { sendTelegramMessage } from './send-telegram-message';
import { sendTelegramMediaGroup } from './send-telegram-media-group';

/** Фиктивное фото без реального адреса или токена. */
const photo = { id: 1, type: 'photo', url: 'test-photo-id' };
/** Клавиатура со ссылкой для проверки сохранения кнопок. */
const buttons = [{ id: 'support', text: 'Поддержка', url: 'https://example.org/support' }];

beforeEach(() => {
  vi.mocked(fetchWithProxy).mockReset();
  vi.mocked(fetchWithProxy).mockResolvedValue(new Response(JSON.stringify({ ok: true, result: { message_id: 7 } })));
});

describe('Отправка пакета медиа', () => {
  it('отклоняет альбом с кнопками до запроса, не отправляя первое фото', async () => {
    await expect(sendTelegramMessage('test', '1', 'Текст', [photo, photo], buttons, true))
      .rejects.toThrow('Оставьте одно вложение');
    expect(fetchWithProxy).not.toHaveBeenCalled();
  });

  it('прямой вызов альбома не обрезает одиннадцатое вложение', async () => {
    await expect(sendTelegramMediaGroup('test', '1', 'Текст', Array(11).fill(photo), true))
      .rejects.toThrow('не более 10');
    expect(fetchWithProxy).not.toHaveBeenCalled();
  });

  it.each([{ mediaFiles: [] }, { mediaFiles: [photo] }])('сохраняет отправку текста и одного фото с кнопкой: $mediaFiles', async ({ mediaFiles }) => {
    const result = await sendTelegramMessage('test', '1', 'Текст', mediaFiles, buttons, true);
    expect(result.result?.message_id).toBe(7);
    expect(fetchWithProxy).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetchWithProxy).mock.calls[0];
    expect(String(url)).toContain(mediaFiles.length ? '/sendPhoto' : '/sendMessage');
    expect(JSON.parse(String(options?.body))).toMatchObject({
      reply_markup: { inline_keyboard: [[{ text: 'Поддержка', url: 'https://example.org/support' }]] },
    });
  });

  it('отправляет все фото альбомом и возвращает ID первого сообщения с подписью', async () => {
    vi.mocked(fetchWithProxy).mockResolvedValue(new Response(JSON.stringify({
      ok: true, result: [{ message_id: 7 }, { message_id: 8 }],
    })));
    const result = await sendTelegramMessage('test', '1', 'Текст', [photo, photo], [], true);
    expect(result.result?.message_id).toBe(7);
    const [url, options] = vi.mocked(fetchWithProxy).mock.calls[0];
    expect(String(url)).toContain('/sendMediaGroup');
    const body = JSON.parse(String(options?.body));
    expect(body.media).toHaveLength(2);
    expect(body.media[0].caption).toBe('Текст');
  });
});
