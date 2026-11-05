/** @fileoverview Изолированные проверки новых MCP операций без реальных отправок. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { registerUserDataTools } from './mcp-register-user-data-tools';
import { registerDialogWriteTools } from './mcp-register-dialog-write-tools';
import { registerBroadcastTools } from './mcp-register-broadcast-tools';
import { deleteUserDataAtomically } from '../../server/routes/botUsers/delete-user-data-atomically';
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('./api-fetch.ts', () => ({ apiFetch: mocks.fetch }));
/** Собирает контракты и обработчики без транспорта. */
function tools() {
  const entries = new Map<string, { config: any; handler: any }>();
  const server = { registerTool: (name: string, config: unknown, handler: unknown) => entries.set(name, { config, handler }) };
  for (const register of [registerUserDataTools, registerDialogWriteTools, registerBroadcastTools]) register(server as never);
  return entries;
}
beforeEach(() => { mocks.fetch.mockReset(); });
describe('Новые действия пользовательских разделов', () => {
  it('передаёт выбранного бота, поиск и пагинацию, возвращает userData', async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ users: [{ userData: { answer: 'Да' } }], total: 1 })));
    const entry = tools().get('db_list_users')!;
    const args = z.object(entry.config.inputSchema).parse({ project_id: 12, tokenId: 9, search: 'a & b' });
    const result = await entry.handler(args);
    expect(mocks.fetch.mock.calls[0][0]).toContain('tokenId=9');
    expect(mocks.fetch.mock.calls[0][0]).toContain('search=a+%26+b');
    expect(JSON.parse(result.content[0].text).users[0].userData.answer).toBe('Да');
  });
  it('передаёт только фиксированный маршрут отправки и не повторяет запрос', async () => {
    mocks.fetch.mockRejectedValue(new Error('secret'));
    const entry = tools().get('db_send_dialog_message')!;
    const args = z.object(entry.config.inputSchema).parse({ project_id: 12, token_id: 9, requestId: '11111111-1111-4111-8111-111111111111', user_id: '45', messageText: 'Привет' });
    const result = await entry.handler(args);
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch.mock.calls[0][0]).toBe('/api/projects/12/users/45/send-message?tokenId=9');
  });
  it('помечает реальные отправки неидемпотентными и ошибки HTTP ошибками MCP', async () => {
    const entry = tools().get('db_start_broadcast')!;
    expect(entry.config.annotations.idempotentHint).toBe(false);
    mocks.fetch.mockResolvedValue(new Response('secret', { status: 403 }));
    const args = z.object(entry.config.inputSchema).parse({ project_id: 12, tokenId: 9, requestId: '11111111-1111-4111-8111-111111111111', messageText: 'Тест' });
    expect((await entry.handler(args)).isError).toBe(true);
    expect(mocks.fetch.mock.calls[0][0]).toBe('/api/projects/12/broadcasts?tokenId=9');
  });
  it('отмена использует числовой ID существующей задачи', async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ job: { status: 'cancelling' } })));
    await tools().get('db_cancel_chat_access_check')!.handler({ project_id: 12, token_id: 9, job_id: 3 });
    expect(mocks.fetch.mock.calls[0][0]).toBe('/api/projects/12/chat-access-checks/3/cancel?tokenId=9');
  });
  it('откатывает удаление при ошибке второй таблицы, не возвращая успех', async () => {
    const query = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 2 }).mockRejectedValueOnce(new Error('ошибка')).mockResolvedValueOnce({});
    const release = vi.fn();
    await expect(deleteUserDataAtomically({ connect: vi.fn().mockResolvedValue({ query, release }) } as never, 12, 9)).rejects.toThrow();
    expect(query.mock.calls.map(call => call[0])).toEqual(['BEGIN', 'DELETE FROM bot_messages WHERE project_id = $1 AND token_id = $2', 'DELETE FROM bot_users WHERE project_id = $1 AND token_id = $2', 'ROLLBACK']);
    expect(release).toHaveBeenCalledOnce();
  });
  it('подтверждает удаление после COMMIT и привязывает обе таблицы к пользователю', async () => {
    const query = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 2 }).mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({});
    const value = await deleteUserDataAtomically({ connect: vi.fn().mockResolvedValue({ query, release: vi.fn() }) } as never, 12, 9, '45');
    expect(value).toMatchObject({ deleted: true, deletedCount: 3, deletedUsers: 1 });
    expect(query.mock.calls[1][1]).toEqual([12, 9, '45']);
    expect(query.mock.calls[query.mock.calls.length - 1]![0]).toBe('COMMIT');
  });
});
