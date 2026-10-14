/** @fileoverview Общая регистрация инструмента чтения диалогов для HTTP и stdio. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listDialogsInDb } from './dialogs-db.ts';
import { getDialogMessagesInDb } from './dialog-messages-db.ts';

/**
 * Регистрирует чтение известных панели диалогов выбранного бота.
 * @param server - Сервер MCP
 * @returns Ничего
 */
export function registerDialogTools(server: McpServer): void {
  /** История доступна в обоих транспортах через общую регистрацию. */
  server.registerTool('db_get_dialog_messages', {
    description: 'Читает сохранённые сообщения конкретного чата выбранного бота. Первая страница — последние сообщения, курсор ведёт к более старым; внутри страницы хронологический порядок. Контекст групп доступен только для private и содержит лишь входящие сообщения этого пользователя. Не вызывает Telegram; история ограничена сроком хранения.',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    inputSchema: {
      /** Проект с разрешённым доступом. */
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      /** Токен выбранного бота. */
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      /** Идентификатор Telegram из списка диалогов. */
      chat_id: z.string().regex(/^-?[1-9]\d{0,19}$/),
      /** Тип чата из списка диалогов. */
      chat_type: z.enum(['private', 'group', 'supergroup', 'channel']),
      /** Размер страницы: по умолчанию 10 последних сообщений. */
      limit: z.number().int().min(1).max(100).default(10),
      /** Продолжение к более старым сообщениям. */
      cursor: z.string().max(2048).optional(),
      /** Входящие сообщения человека в группах этого бота. */
      include_group_context: z.boolean().default(false),
    },
  }, async ({ project_id, ...options }) => {
    const value = await getDialogMessagesInDb(project_id, options);
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
  server.registerTool('db_list_dialogs', {
    description: 'Список сохранённых диалогов бота: поиск по имени, названию, username и ID, пагинация, последнее сообщение и сохранённый доступ. Не проверяет Telegram; счётчики зависят от хранения истории.',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    inputSchema: {
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      kind: z.enum(['all', 'users', 'groups', 'channels']).default('all'),
      search: z.string().max(200).optional(),
      /** По умолчанию выдаются только 10 последних диалогов. */
      limit: z.number().int().min(1).max(100).default(10),
      cursor: z.string().max(2048).optional(),
    },
  }, async ({ project_id, ...options }) => {
    const value = await listDialogsInDb(project_id, options);
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
}
