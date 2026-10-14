/** @fileoverview Проверки истории MCP, курсоров, авторизации и безопасных метаданных. */
import { beforeEach, expect, it, vi } from 'vitest';
import { dialogMessageParams, decodeMessageCursor, encodeMessageCursor } from '../../server/routes/dialogs/message-pagination';
import { mapDialogMessage, mapTelegramMedia } from '../../server/routes/dialogs/message-mapping';
import { getDialogMessagesHandler } from '../../server/routes/dialogs/get-dialog-messages-handler';
import { getDialogMessagesInDb } from './dialog-messages-db';
import { registerDialogTools } from './mcp-register-dialog-tools';

const mocks = vi.hoisted(() => ({ token: vi.fn(), query: vi.fn(), fetch: vi.fn() }));
vi.mock('../../server/database/db', () => ({ pool: { query: mocks.query } }));
vi.mock('../../server/storages/storage', () => ({ storage: { getBotToken: mocks.token } }));
vi.mock('./api-fetch', () => ({ apiFetch: mocks.fetch }));

/**
 * Вызывает API истории без сети.
 * @param query - Параметры запроса
 * @returns Имитированный ответ
 */
async function invoke(query: Record<string, unknown>) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await getDialogMessagesHandler({ params: { projectId: '9', chatId: '123' }, query } as never, res as never);
  return res;
}
beforeEach(() => { vi.clearAllMocks(); mocks.token.mockResolvedValue({ id: 5, projectId: 9 }); });

it('проверяет токен, размер страницы и допустимость группового контекста', () => {
  expect(dialogMessageParams.safeParse({ chatType: 'private' }).success).toBe(false);
  expect(dialogMessageParams.safeParse({ tokenId: 5, chatType: 'private', limit: 101 }).success).toBe(false);
  expect(dialogMessageParams.safeParse({ tokenId: 5, chatType: 'channel', includeGroupContext: 'true' }).success).toBe(false);
  expect(dialogMessageParams.parse({ tokenId: 5, chatType: 'private' })).toMatchObject({ limit: 10, includeGroupContext: false });
  expect(dialogMessageParams.parse({ tokenId: 5, chatType: 'private', limit: 70 }).limit).toBe(70);
});
it('курсор привязан к полной области и допускает отсутствие даты', () => {
  const cursor = encodeMessageCursor({ scope: '9:5:123:private:false', time: null, id: 7 });
  expect(decodeMessageCursor(cursor, '9:5:123:private:false')?.id).toBe(7);
  expect(() => decodeMessageCursor(cursor, '9:6:123:private:false')).toThrow();
  expect(() => decodeMessageCursor('ошибка', '9:5:123:private:false')).toThrow();
});
it('не возвращает произвольные данные, пути и URL вложений', () => {
  const row = { id: 1, user_id: '123', chat_id: '123', chat_type: 'private', message_type: 'user',
    message_text: 'Текст', created_at: new Date('2026-10-14T04:00:00Z'), message_data: {
      secret: 'скрытый-токен', photo: [{ file_id: 'small' }, { file_id: 'large', width: 100, url: 'secret-url' }],
    } };
  const result = mapDialogMessage(row);
  expect(result.direction).toBe('incoming');
  expect(result.created_at).toBe('2026-10-14T04:00:00.000Z');
  expect(result.telegram_media).toEqual([{ type: 'photo', file_id: 'large', width: 100 }]);
  expect(JSON.stringify(result)).not.toContain('скрытый-токен');
  expect(JSON.stringify(result)).not.toContain('secret-url');
  expect(mapTelegramMedia(null)).toEqual([]);
});
it('чужой токен отклоняется до чтения истории', async () => {
  mocks.token.mockResolvedValue({ id: 5, projectId: 12 });
  const res = await invoke({ tokenId: 5, chatType: 'private' });
  expect(res.status).toHaveBeenCalledWith(404);
  expect(mocks.query).not.toHaveBeenCalled();
});
it('пустая страница валидна, повреждённый курсор не запускает запрос', async () => {
  mocks.query.mockResolvedValue({ rows: [] });
  const res = await invoke({ tokenId: 5, chatType: 'private' });
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ messages: [], has_more: false, next_cursor: null }));
  mocks.query.mockClear();
  const invalid = await invoke({ tokenId: 5, chatType: 'private', cursor: 'ошибка' });
  expect(invalid.status).toHaveBeenCalledWith(400);
  expect(mocks.query).not.toHaveBeenCalled();
});
it('отбирает последние записи и возвращает хронологический порядок страницы', async () => {
  mocks.query.mockResolvedValue({ rows: [3, 2, 1].map(id => ({ id, created_at: new Date('2026-10-14'), message_type: 'user' })) });
  const res = await invoke({ tokenId: 5, chatType: 'private', limit: 2 });
  const value = res.json.mock.calls[0][0];
  expect(value.messages.map((message: { /** Идентификатор записи. */ id: number }) => message.id)).toEqual([2, 3]);
  expect(value.has_more).toBe(true);
  const scope = JSON.stringify([9, 5, '123', 'private', false]);
  expect(decodeMessageCursor(value.next_cursor, scope)?.id).toBe(2);
});
it('MCP сохраняет параметры и возвращает безопасные ошибки HTTP/сети', async () => {
  const options = { token_id: 5, chat_id: '123', chat_type: 'private' as const };
  mocks.fetch.mockResolvedValue({ ok: false, status: 403 });
  expect(await getDialogMessagesInDb(9, options)).toEqual({ error: 'Не удалось получить историю диалога: HTTP 403' });
  expect(mocks.fetch.mock.calls[0][0]).toContain('tokenId=5&chatType=private');
  mocks.fetch.mockRejectedValue(new Error('секрет сети'));
  expect(JSON.stringify(await getDialogMessagesInDb(9, options))).not.toContain('секрет');
});
it('обрабатывает успешный ответ и отмечает ошибки инструмента', async () => {
  const value = { ok: true, project_id: 9, token_id: 5, chat_id: '123', chat_type: 'private',
    include_group_context: false, messages: [], has_more: false, next_cursor: null };
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => value });
  expect(await getDialogMessagesInDb(9, { token_id: 5, chat_id: '123', chat_type: 'private' })).toEqual(value);
  const registerTool = vi.fn();
  registerDialogTools({ registerTool } as never);
  const entry = registerTool.mock.calls.find(([name]) => name === 'db_get_dialog_messages');
  expect(entry?.[1].annotations.readOnlyHint).toBe(true);
  mocks.fetch.mockResolvedValue({ ok: false, status: 404 });
  const result = await entry?.[2]({ project_id: 9, token_id: 5, chat_id: '123', chat_type: 'private' });
  expect(result.isError).toBe(true);
});
