/** @fileoverview Проверки валидации, безопасных ошибок и регистрации поиска диалогов. */
import { beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dialogSearchParams } from '../../server/routes/dialogs/message-search-query';
import { searchDialogMessagesHandler } from '../../server/routes/dialogs/search-dialog-messages-handler';
import { searchDialogMessagesInDb } from './dialog-search-db';
import { registerDialogTools } from './mcp-register-dialog-tools';
import { z } from 'zod';

const mocks = vi.hoisted(() => ({ token: vi.fn(), query: vi.fn(), fetch: vi.fn() }));
vi.mock('../../server/database/db', () => ({ pool: { query: mocks.query } }));
vi.mock('../../server/storages/storage', () => ({ storage: { getBotToken: mocks.token } }));
vi.mock('./api-fetch', () => ({ apiFetch: mocks.fetch }));

/**
 * Выполняет обработчик поиска без сети.
 * @param query - Фильтры
 * @returns Ответ обработчика
 */
async function invoke(query: Record<string, unknown>) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await searchDialogMessagesHandler({ params: { projectId: '9' }, query } as never, res as never);
  return res;
}
beforeEach(() => { vi.clearAllMocks(); mocks.token.mockResolvedValue({ id: 5, projectId: 9 }); });

it('проверяет обязательные параметры, текст, зависимости фильтров и лимиты', () => {
  for (const extra of [{ tokenId: undefined }, { query: '' }, { query: '   ' }, { query: 'я'.repeat(201) },
    { limit: 101 }, { limit: 0 }, { chatId: '123' }, { chatId: '0', chatType: 'private' }]) {
    expect(dialogSearchParams.safeParse({ tokenId: 5, query: 'текст', ...extra }).success).toBe(false);
  }
  expect(dialogSearchParams.parse({ tokenId: 5, query: ' текст ' })).toMatchObject({ query: 'текст', limit: 10 });
  expect(dialogSearchParams.parse({ tokenId: 5, query: 'текст', limit: 70, chatType: 'group' }).limit).toBe(70);
});
it('отклоняет чужой токен до SQL и ошибочный курсор до чтения данных', async () => {
  mocks.token.mockResolvedValue({ projectId: 12 });
  expect((await invoke({ tokenId: 5, query: 'текст' })).status).toHaveBeenCalledWith(404);
  expect(mocks.query).not.toHaveBeenCalled();
  expect((await invoke({ tokenId: 5, query: 'текст', cursor: 'ошибка' })).status).toHaveBeenCalledWith(400);
  expect(mocks.query).not.toHaveBeenCalled();
});
it('пустая страница допустима, ошибки БД безопасны', async () => {
  mocks.query.mockResolvedValue({ rows: [] });
  expect((await invoke({ tokenId: 5, query: 'текст' })).json).toHaveBeenCalledWith(expect.objectContaining({ messages: [], has_more: false, next_cursor: null }));
  mocks.query.mockRejectedValue(new Error('секрет'));
  const res = await invoke({ tokenId: 5, query: 'текст' });
  expect(res.status).toHaveBeenCalledWith(500);
  expect(JSON.stringify(res.json.mock.calls)).not.toContain('секрет');
});
it('оставляет порядок newest-first и десять сообщений по умолчанию', async () => {
  mocks.query.mockResolvedValue({ rows: Array.from({ length: 11 }, (_, index) => ({ id: 20-index, created_at: new Date('2026-10-14'), message_type: 'user' })) });
  const res = await invoke({ tokenId: 5, query: 'текст' });
  const value = res.json.mock.calls[0][0];
  expect(value.messages).toHaveLength(10);
  expect(value.messages[0].id).toBe(20);
  expect(value.messages[9].id).toBe(11);
  expect(value.has_more).toBe(true);
  expect(value.next_cursor).toBeTypeOf('string');
});
it('MCP передаёт фильтры, кодирует текст и скрывает HTTP/сетевые ошибки', async () => {
  const options = { token_id: 5, query: '50%_тест', chat_id: '123', chat_type: 'private' as const };
  mocks.fetch.mockResolvedValue({ ok: false, status: 403 });
  expect(await searchDialogMessagesInDb(9, options)).toEqual({ error: 'Не удалось выполнить поиск сообщений: HTTP 403' });
  expect(mocks.fetch.mock.calls[0][0]).toContain('/dialogs/messages/search?tokenId=5&query=50%25_');
  mocks.fetch.mockRejectedValue(new Error('секрет сети'));
  expect(JSON.stringify(await searchDialogMessagesInDb(9, options))).not.toContain('секрет');
  mocks.fetch.mockClear();
  expect(await searchDialogMessagesInDb(9, { token_id: 5, query: 'текст', chat_id: '123' })).toHaveProperty('error');
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it('MCP принимает только ответ своей области и регистрирует read-only инструмент', async () => {
  const value = { ok: true, project_id: 9, token_id: 5, query: 'текст', chat_id: null, chat_type: null, messages: [], has_more: false, next_cursor: null };
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => value });
  expect(await searchDialogMessagesInDb(9, { token_id: 5, query: 'текст' })).toEqual(value);
  expect(await searchDialogMessagesInDb(10, { token_id: 5, query: 'текст' })).toHaveProperty('error');
  const registerTool = vi.fn();
  registerDialogTools({ registerTool } as never);
  const entry = registerTool.mock.calls.find(([name]) => name === 'db_search_dialog_messages')!;
  expect(entry[1].annotations.readOnlyHint).toBe(true);
  expect(z.object(entry[1].inputSchema).parse({ project_id: 9, token_id: 5, query: 'текст' }).limit).toBe(10);
  mocks.fetch.mockResolvedValue({ ok: false, status: 404 });
  expect((await entry[2]({ project_id: 9, token_id: 5, query: 'текст' })).isError).toBe(true);
});
it('API защищён доступом к проекту и общий реестр вызывается обоими транспортами', () => {
  const routes = readFileSync('server/routes/setupBotIntegrationRoutes.ts', 'utf8');
  expect(routes).toContain("'/api/projects/:projectId/dialogs/messages/search', requireProjectAccess, searchDialogMessagesHandler");
  expect(routes.indexOf('/dialogs/messages/search')).toBeLessThan(routes.indexOf('/dialogs/:chatId/messages'));
  expect(readFileSync('lib/bot-tools/mcp-register-tools.ts', 'utf8')).toContain('registerDialogTools(server)');
  for (const file of ['tools/mcp-server/index.ts', 'server/routes/mcp/handleMcpHttpRequest.ts']) {
    expect(readFileSync(file, 'utf8')).toContain('createBotcraftMcpServer');
  }
});
