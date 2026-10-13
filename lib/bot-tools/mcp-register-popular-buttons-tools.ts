/**
 * @fileoverview Регистрация MCP-инструмента рейтинга нажатий кнопок.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { USERS_ANALYTICS_PERIODS } from './users-analytics-types.ts';
import { getPopularButtonsInDb } from './popular-buttons-db.ts';

/**
 * Подключает чтение топа кнопок к серверу обоих транспортов MCP.
 * @param server - Сервер MCP.
 * @returns Ничего.
 */
export function registerPopularButtonsTools(server: McpServer): void {
  server.registerTool('db_get_popular_buttons', {
    description: 'Карточка «Топ кнопок»: до 10 меток по сохранённым нажатиям за период. Период по умолчанию 30d; 12w — 84 дня. returned_clicks — сумма топа, а не всех нажатий. История зависит от удаления сообщений. Без token_id все боты проекта. Доступ проверяет API проекта.',
    inputSchema: {
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
      period: z.enum(USERS_ANALYTICS_PERIODS).optional(),
    },
  }, async ({ project_id, token_id, period }) => {
    const value = await getPopularButtonsInDb(project_id, { tokenId: token_id, period });
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
}
