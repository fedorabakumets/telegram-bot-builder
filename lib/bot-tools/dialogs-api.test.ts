/** @fileoverview Проверки параметров, курсоров и регистрации списка диалогов. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dialogParams, decodeDialogCursor, encodeDialogCursor } from '../../server/routes/dialogs/dialog-pagination';
import { listDialogsHandler } from '../../server/routes/dialogs/list-dialogs-handler';
import { listDialogsInDb } from './dialogs-db';
import { registerDialogTools } from './mcp-register-dialog-tools';

const mocks = vi.hoisted(() => ({ query: vi.fn(), token: vi.fn(), fetch: vi.fn() }));
vi.mock('../../server/database/db', () => ({ pool: { query: mocks.query } }));
vi.mock('../../server/storages/storage', () => ({ storage: { getBotToken: mocks.token } }));
vi.mock('./api-fetch', () => ({ apiFetch: mocks.fetch }));

/**
 * Вызывает обработчик с имитацией HTTP без реальной сети.
 * @param query - Параметры списка
 * @returns Записанный HTTP-ответ
 */
async function invoke(query: Record<string, unknown>) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await listDialogsHandler({ params: { projectId: '12' }, query } as never, res as never);
  return res;
}

beforeEach(() => { vi.clearAllMocks(); mocks.token.mockResolvedValue({ id: 9, projectId: 12 }); });
describe('Список диалогов', () => {
  it('проверяет обязательный токен и границы страницы', () => {
    expect(dialogParams.safeParse({}).success).toBe(false);
    expect(dialogParams.safeParse({ tokenId: 9, limit: 101 }).success).toBe(false);
    expect(dialogParams.parse({ tokenId: '9' })).toMatchObject({ limit: 50, kind: 'all' });
  });
  it('привязывает курсор к фильтрам и проверяет его содержимое', () => {
    const cursor = encodeDialogCursor({ scope: '12:9', time: null, type: 'supergroup', id: '-1001' });
    expect(decodeDialogCursor(cursor, '12:9')?.time).toBeNull();
    expect(() => decodeDialogCursor(cursor, '12:10')).toThrow();
    expect(() => decodeDialogCursor('сломанный курсор', '12:9')).toThrow();
  });
  it('не подставляет другого бота и не выполняет SQL при отказе', async () => {
    mocks.token.mockResolvedValue({ id: 9, projectId: 13 });
    const res = await invoke({ tokenId: 9 });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('возвращает пустую страницу и связывает поиск с выбранным токеном', async () => {
    mocks.query.mockResolvedValue({ rows: [] });
    const res = await invoke({ tokenId: 9, kind: 'groups', search: 'CULT' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ dialogs: [], has_more: false, next_cursor: null }));
    expect(mocks.query.mock.calls[0][1]).toEqual([12, 9, 'groups', '%CULT%', 51]);
  });
  it('создаёт курсор и продолжает после равной или пустой даты', async () => {
    const row = { chat_id: '-1001', chat_type: 'supergroup', last_activity_at: null };
    mocks.query.mockResolvedValueOnce({ rows: [row, { ...row, chat_id: '-1002' }] });
    const first = await invoke({ tokenId: 9, limit: 1 });
    const page = first.json.mock.calls[0][0];
    expect(page.has_more).toBe(true);
    mocks.query.mockResolvedValue({ rows: [] });
    await invoke({ tokenId: 9, limit: 1, cursor: page.next_cursor });
    expect(mocks.query.mock.calls[1][1]).toEqual([12, 9, 'all', '%%', null, 'supergroup', '-1001', 2]);
  });
  it('возвращает время сообщения в UTC с единым ISO-форматом', async () => {
    mocks.query.mockResolvedValue({ rows: [{ chat_id: '1', chat_type: 'private',
      last_message: { preview: 'Привет', direction: 'incoming', created_at: '2026-10-13T10:00:00+00:00' } }] });
    const res = await invoke({ tokenId: 9 });
    expect(res.json.mock.calls[0][0].dialogs[0].last_message.created_at).toBe('2026-10-13T10:00:00.000Z');
  });
  it('MCP использует API и скрывает внутренние ошибки', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 403 });
    expect(await listDialogsInDb(12, { token_id: 9 })).toEqual({ error: 'Не удалось получить диалоги: HTTP 403' });
    mocks.fetch.mockRejectedValue(new Error('секретная строка подключения'));
    expect(JSON.stringify(await listDialogsInDb(12, { token_id: 9 }))).not.toContain('секретная');
  });
  it('регистрирует инструмент чтения для общей регистрации транспортов', () => {
    const registerTool = vi.fn();
    registerDialogTools({ registerTool } as never);
    expect(registerTool.mock.calls[0][0]).toBe('db_list_dialogs');
    expect(registerTool.mock.calls[0][1].annotations.readOnlyHint).toBe(true);
  });
});
