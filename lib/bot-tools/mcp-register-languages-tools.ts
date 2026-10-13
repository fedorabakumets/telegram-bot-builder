/** @fileoverview Регистрация MCP распределения аудитории по известным языкам. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getUsersLanguagesInDb } from './users-languages-db.ts';

/**
 * Регистрирует снимок языков без неподдерживаемого фильтра периода.
 * @param server - Сервер MCP любого транспорта.
 * @returns Ничего.
 */
export function registerLanguagesTools(server: McpServer): void {
  server.registerTool('db_get_users_languages', {
    description: 'Карточка «Языки»: снимок сохранённой аудитории, до 20 крупнейших языков. Проценты среди всех записей с известным языком, не только топ-20. Без периода; неизвестные языки исключены. Без token_id все боты проекта; доступ проверяет API.',
    inputSchema: {
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    },
  }, async ({ project_id, token_id }) => {
    const result = await getUsersLanguagesInDb(project_id, { tokenId: token_id });
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      ...('error' in result ? { isError: true } : {}) };
  });
}
