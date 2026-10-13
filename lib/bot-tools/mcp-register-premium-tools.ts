/**
 * @fileoverview Регистрация MCP-снимка Premium для общих транспортов сервера.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getUsersPremiumInDb } from './users-premium-db.ts';

/**
 * Подключает чтение распределения Premium без выдуманного периода.
 * @param server - Сервер MCP.
 * @returns Ничего.
 */
export function registerPremiumTools(server: McpServer): void {
  server.registerTool('db_get_users_premium', {
    description: 'Текущий снимок карточки Premium: Premium и обычные пользователи, количество и целые проценты. Читает сохранённые bot_users, без истории и периода; статус может устареть. Без token_id все боты проекта, один человек может учитываться у нескольких ботов. Доступ проверяется API проекта.',
    inputSchema: {
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    },
  }, async ({ project_id, token_id }) => {
    const value = await getUsersPremiumInDb(project_id, { tokenId: token_id });
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
}
