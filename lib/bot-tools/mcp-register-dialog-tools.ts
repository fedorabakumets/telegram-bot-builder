/** @fileoverview Общая регистрация инструмента чтения диалогов для HTTP и stdio. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listDialogsInDb } from './dialogs-db.ts';

/**
 * Регистрирует чтение известных панели диалогов выбранного бота.
 * @param server - Сервер MCP
 * @returns Ничего
 */
export function registerDialogTools(server: McpServer): void {
  server.registerTool('db_list_dialogs', {
    description: 'Список сохранённых диалогов бота: поиск по имени, названию, username и ID, пагинация, последнее сообщение и сохранённый доступ. Не проверяет Telegram; счётчики зависят от хранения истории.',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    inputSchema: {
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      kind: z.enum(['all', 'users', 'groups', 'channels']).default('all'),
      search: z.string().max(200).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().max(2048).optional(),
    },
  }, async ({ project_id, ...options }) => {
    const value = await listDialogsInDb(project_id, options);
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
}
