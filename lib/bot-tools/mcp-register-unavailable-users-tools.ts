/**
 * @fileoverview Регистрация списка удалённых и заблокировавших для обоих транспортов MCP.
 * @module lib/bot-tools/mcp-register-unavailable-users-tools
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listUnavailableUsersInDb } from './unavailable-users-db.ts';

/**
 * Подключает чтение людей, которые удалены или заблокировали бота.
 * @param server - Сервер MCP
 * @returns Ничего
 */
export function registerUnavailableUsersTools(server: McpServer): void {
  server.registerTool('db_list_unavailable_users', {
    description: 'Люди выбранного бота с удалённым аккаунтом или блокировкой бота. kind: deleted, blocked или both. Возвращает id, имя, username и ссылки tg://user?id= и https://t.me/, если username есть. Telegram не вызывается, токен не возвращается. token_id обязателен. Страница до 50, по умолчанию 20.',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    inputSchema: {
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      kind: z.enum(['deleted', 'blocked', 'both']).optional(),
      limit: z.number().int().min(1).max(50).optional(),
      offset: z.number().int().min(0).max(100_000).optional(),
    },
  }, async ({ project_id, token_id, kind, limit, offset }) => {
    const value = await listUnavailableUsersInDb(project_id, { tokenId: token_id, kind, limit, offset });
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
}
