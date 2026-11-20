/** @fileoverview Регрессии массовой правки: клавиатура, реальные ID, ошибки и границы истории. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../../../database/db', async () => ({ db: (await import('./edit-broadcast-test-fixture')).testDb }));
vi.mock('../../../../terminal/broadcastProjectEvent', async () => ({
  broadcastProjectEvent: (await import('./edit-broadcast-test-fixture')).fixture.event,
}));
vi.mock('./broadcast-telegram-ops', async () => {
  const { fixture } = await import('./edit-broadcast-test-fixture');
  return { editTelegramBroadcastMessage: fixture.edit, throttleBroadcastTelegramOps: fixture.pause };
});
import { fixture, resetEditFixture } from './edit-broadcast-test-fixture';
import { editBroadcastMessages } from './edit-broadcast-messages';

/** Выполняет правку одного сохранённого сообщения. */
const edit = () => editBroadcastMessages(13, 40, 11, 'Вход через Telegram снова работает');

describe('Правка уже доставленной рассылки', () => {
  beforeEach(resetEditFixture);
  it('сохраняет URL-кнопку при изменении только текста и использует Telegram ID', async () => {
    expect(await edit()).toMatchObject({ edited: 1, failed: 0 });
    expect(fixture.edit).toHaveBeenCalledExactlyOnceWith('test-token', '42', 98765,
      'Вход через Telegram снова работает', {
        hasMedia: false, replyMarkup: { inline_keyboard: [[{ text: 'Открыть поддержку', url: 'https://torlink.life/support' }]] },
      });
  });
  it('сохраняет заданное количество кнопок в ряду', async () => {
    fixture.rows.broadcasts[0].buttons = Array.from({ length: 5 }, (_, index) => ({ id: `b${index}`, text: `Кнопка ${index}` }));
    await edit();
    expect(fixture.edit.mock.calls[0][4].replyMarkup.inline_keyboard.map((row: unknown[]) => row.length)).toEqual([2, 2, 1]);
  });
  it('не теряет старые рассылки без раскладки и без кнопок', async () => {
    delete fixture.rows.broadcasts[0].buttonsPerRow;
    fixture.rows.broadcasts[0].buttons = null;
    await edit();
    expect(fixture.edit.mock.calls[0][4]).toMatchObject({ replyMarkup: { inline_keyboard: [] } });
  });
  it('синхронизирует историю и событие только для подтверждённой правки', async () => {
    fixture.rows.broadcast_results.push({ id: 902, broadcastId: 40, userId: '43', status: 'sent', telegramMessageId: 98766 });
    fixture.edit.mockResolvedValueOnce({ status: 'edited' }).mockResolvedValueOnce({ status: 'failed', description: 'message not found' });
    expect(await edit()).toMatchObject({ edited: 1, failed: 1 });
    expect(fixture.edit).toHaveBeenCalledTimes(2);
    const history = fixture.writes.filter(query => query.table === 'bot_messages');
    expect(history).toHaveLength(1);
    expect(history[0].sql).toMatch(/project_id/);
    expect(history[0].sql).toMatch(/token_id/);
    expect(history[0].sql).toMatch(/user_id/);
    expect(history[0].sql).toMatch(/telegram_message_id/);
    expect(history[0].sql).toMatch(/message_type/);
    expect(history[0].sql).toMatch(/broadcastId/);
    expect(history[0].params).toEqual(expect.arrayContaining([13, 11, '42', 98765, '40']));
    expect(history[0].params).not.toContain('43');
    expect(fixture.event).toHaveBeenCalledTimes(1);
    expect(fixture.event.mock.calls[0][1]).toMatchObject({ data: { messageId: 701, userId: '42' } });
  });
  it('считает уже совпадающий текст подтверждённым и восстанавливает локальную историю', async () => {
    fixture.edit.mockResolvedValue({ status: 'unchanged' });
    expect(await edit()).toMatchObject({ edited: 0, unchanged: 1, failed: 0 });
    expect(fixture.writes.some(query => query.table === 'bot_messages')).toBe(true);
    expect(fixture.event).toHaveBeenCalledTimes(1);
  });
  it('при неизвестном ответе не подменяет историю и не отправляет сообщение повторно', async () => {
    fixture.edit.mockResolvedValue({ status: 'unknown', description: 'Не удалось получить ответ Telegram' });
    expect(await edit()).toMatchObject({ attempted: 1, edited: 0, unknown: 1, failed: 0 });
    expect(fixture.edit).toHaveBeenCalledTimes(1);
    expect(fixture.writes.filter(query => query.table === 'bot_messages')).toHaveLength(0);
    expect(fixture.event).not.toHaveBeenCalled();
  });
  it('не изменяет данные и не обращается к Telegram при отсутствующем токене', async () => {
    fixture.rows.bot_tokens = [];
    expect(await edit()).toMatchObject({ attempted: 0, edited: 0, failed: 1 });
    expect(fixture.edit).not.toHaveBeenCalled();
    expect(fixture.writes).toHaveLength(0);
    expect(fixture.event).not.toHaveBeenCalled();
  });
  it('запрещает правку выполняющейся очереди, не меняя её будущие сообщения', async () => {
    fixture.rows.broadcasts[0].status = 'running';
    await expect(edit()).rejects.toThrow();
    expect(fixture.edit).not.toHaveBeenCalled();
    expect(fixture.writes).toHaveLength(0);
  });
  it('пропускает старую запись без Telegram ID и не подставляет внутренний ID', async () => {
    fixture.rows.broadcast_results[0].telegramMessageId = null;
    expect(await edit()).toMatchObject({ attempted: 0, skipped: 1, edited: 0 });
    expect(fixture.edit).not.toHaveBeenCalled();
    expect(fixture.writes).toHaveLength(0);
    expect(fixture.event).not.toHaveBeenCalled();
  });
  it('передаёт признак подписи для сохранённых медиа, оставляя клавиатуру', async () => {
    fixture.rows.broadcasts[0].mediaUrls = ['https://example.com/photo.jpg'];
    await edit();
    expect(fixture.edit.mock.calls[0][4]).toMatchObject({ hasMedia: true,
      replyMarkup: { inline_keyboard: [[{ text: 'Открыть поддержку', url: 'https://torlink.life/support' }]] } });
  });
  it('ограничивает чтение проектом и ботом, выбирая только доставленные сообщения', async () => {
    await edit();
    const broadcast = fixture.reads.find(query => query.table === 'broadcasts')!;
    expect(broadcast.sql).toMatch(/project_id/);
    expect(broadcast.sql).toMatch(/token_id/);
    expect(broadcast.params).toEqual([40, 13, 11]);
    const results = fixture.reads.find(query => query.table === 'broadcast_results')!;
    expect(results.sql).toMatch(/status/);
    expect(results.params).toEqual([40, 'sent']);
  });
  it('блокирует параллельную правку той же рассылки и освобождает блокировку', async () => {
    let finish!: (value: { status: string }) => void;
    fixture.edit.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const first = edit();
    await vi.waitFor(() => expect(fixture.edit).toHaveBeenCalledTimes(1));
    await expect(edit()).rejects.toThrow();
    finish({ status: 'edited' });
    await first;
    await expect(edit()).resolves.toMatchObject({ edited: 1 });
    expect(fixture.edit).toHaveBeenCalledTimes(2);
  });
  it('не переписывает общий текст при полном отказе Telegram', async () => {
    fixture.edit.mockResolvedValue({ status: 'failed', description: 'message not found' });
    expect(await edit()).toMatchObject({ attempted: 1, edited: 0, failed: 1 });
    expect(fixture.writes).toHaveLength(0);
    expect(fixture.event).not.toHaveBeenCalled();
  });
  it('отделяет отсутствие локальной истории от подтверждённого ответа Telegram', async () => {
    fixture.returnedHistory = [];
    expect(await edit()).toMatchObject({ edited: 1, failed: 0, persistenceFailed: 1 });
    expect(fixture.event).not.toHaveBeenCalled();
    expect(fixture.writes.filter(query => query.table === 'broadcasts')).toHaveLength(0);
    expect(fixture.edit).toHaveBeenCalledTimes(1);
  });
  it('запрещает правку ожидающей запуска рассылки', async () => {
    fixture.rows.broadcasts[0].status = 'pending';
    await expect(edit()).rejects.toThrow();
    expect(fixture.edit).not.toHaveBeenCalled();
    expect(fixture.writes).toHaveLength(0);
  });
  it('сохраняет результат Telegram при сбое финальной записи общего текста', async () => {
    fixture.rejectedUpdateTable = 'broadcasts';
    expect(await edit()).toMatchObject({ edited: 1, persistenceFailed: 1, failed: 0 });
    expect(fixture.edit).toHaveBeenCalledTimes(1);
    expect(fixture.event).toHaveBeenCalledTimes(1);
  });
  it('сохраняет предыдущий успех при неожиданном исключении следующей правки', async () => {
    fixture.rows.broadcast_results.push({ id: 902, broadcastId: 40, userId: '43', status: 'sent', telegramMessageId: 98766 });
    fixture.edit.mockResolvedValueOnce({ status: 'edited' }).mockRejectedValueOnce(new Error('Сбой транспорта'));
    expect(await edit()).toMatchObject({ attempted: 2, edited: 1, unknown: 1, failed: 0 });
    expect(fixture.edit).toHaveBeenCalledTimes(2);
    expect(fixture.event).toHaveBeenCalledTimes(1);
  });
});
