/** @fileoverview Проверки сохранения клавиатуры и достоверности ответов при правке рассылки. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('../../../../utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../../../../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'https://telegram.test' }));
import { editTelegramBroadcastMessage } from './broadcast-telegram-ops';

/** Клавиатура с разными действиями и раскладкой, которую нужно сохранить без изменений. */
const replyMarkup = { inline_keyboard: [
  [{ text: 'Поддержка', url: 'https://torlink.life/support' }, { text: 'Меню', callback_data: 'menu' }],
  [{ text: 'Приложение', web_app: { url: 'https://example.test' }, style: 'primary' }],
  [{ text: 'Копировать', copy_text: { text: 'код' } }],
] };

/** Подготавливает имитацию ответа Telegram без сетевого обращения. */
function respond(value: unknown) { mocks.fetch.mockResolvedValue({ json: async () => value }); }

describe('Правка сообщения рассылки', () => {
  beforeEach(() => { vi.clearAllMocks(); respond({ ok: true }); });

  it('сохраняет все действия, цвета и ряды кнопок при изменении текста', async () => {
    expect(await editTelegramBroadcastMessage('secret', '42', 12, '<b>Новый текст</b>',
      { replyMarkup, hasMedia: false })).toEqual({ status: 'edited' });
    const [url, request] = mocks.fetch.mock.calls[0];
    expect(url).toMatch(/editMessageText$/);
    expect(JSON.parse(request.body)).toEqual({ chat_id: '42', message_id: 12,
      text: '<b>Новый текст</b>', parse_mode: 'HTML', reply_markup: replyMarkup });
  });

  it('редактирует подпись медиа с сохранением кнопок', async () => {
    await editTelegramBroadcastMessage('secret', '42', 12, '', { replyMarkup, hasMedia: true });
    const [url, request] = mocks.fetch.mock.calls[0];
    expect(url).toMatch(/editMessageCaption$/);
    expect(JSON.parse(request.body)).toEqual({ chat_id: '42', message_id: 12,
      caption: '', parse_mode: 'HTML', reply_markup: replyMarkup });
  });

  it('передаёт явно пустую клавиатуру без пустого ряда', async () => {
    await editTelegramBroadcastMessage('secret', '42', 12, 'Текст',
      { replyMarkup: { inline_keyboard: [] }, hasMedia: false });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).reply_markup).toEqual({ inline_keyboard: [] });
  });

  it('отличает неизменённое сообщение от отказа Telegram', async () => {
    respond({ ok: false, description: 'Bad Request: message is not modified' });
    expect(await editTelegramBroadcastMessage('secret', '42', 12, 'Текст',
      { replyMarkup, hasMedia: false })).toEqual({ status: 'unchanged' });
    respond({ ok: false, description: 'Forbidden' });
    expect(await editTelegramBroadcastMessage('secret', '42', 12, 'Текст',
      { replyMarkup, hasMedia: false })).toEqual({ status: 'failed', description: 'Forbidden' });
  });

  it('не объявляет сетевую ошибку или некорректный ответ подтверждённым отказом', async () => {
    mocks.fetch.mockRejectedValue(new Error('https://telegram.test/botsecret'));
    expect(await editTelegramBroadcastMessage('secret', '42', 12, 'Текст',
      { replyMarkup, hasMedia: false })).toEqual({ status: 'unknown', description: 'Не удалось получить ответ Telegram' });
    respond({ error: 'proxy' });
    expect((await editTelegramBroadcastMessage('secret', '42', 12, 'Текст',
      { replyMarkup, hasMedia: false })).status).toBe('unknown');
  });
});
