/** @fileoverview Общая регистрация инструмента чтения диалогов для HTTP и stdio. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchDialogMessagesInDb } from './dialog-search-db.ts';
import { listDialogsInDb } from './dialogs-db.ts';
import { getDialogMessagesInDb } from './dialog-messages-db.ts';
import { checkChatAccessInDb } from './chat-access-db.ts';
import { getChatAccessCheckInDb, startChatAccessCheckInDb } from './chat-access-check-db.ts';

/**
 * Регистрирует чтение известных панели диалогов выбранного бота.
 * @param server - Сервер MCP
 * @returns Ничего
 */
export function registerDialogTools(server: McpServer): void {
  server.registerTool('db_check_chat_access', {
    description: 'Проверяет через Telegram актуальный доступ бота к личке, группе или каналу. Для лички используется краткое действие «печатает» без сообщения. Сохраняет статус; у групп обновляет название и аватар.',
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    inputSchema: {
      /** Проект с разрешённым доступом. */
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      /** Явно выбранный токен бота. */
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      /** Идентификатор чата Telegram. */
      chat_id: z.string().regex(/^-?[1-9]\d{0,19}$/),
      /** Тип чата из списка диалогов. */
      chat_type: z.enum(['private', 'group', 'supergroup', 'channel']),
    },
  }, async ({ project_id, ...options }) => {
    const value = await checkChatAccessInDb(project_id, options);
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
  server.registerTool('db_start_chat_access_check', {
    description: 'Запускает массовую проверку людей выбранного бота: у кого есть личное сообщение или ещё нет сообщений. Кто писал только в группе или канале, не входит. Для чатов групп и каналов — db_check_chat_access. Действие «печатает» без сообщений. Повторный запуск во время проверки вернёт ошибку. Отмена недоступна. Токен и сырые ответы Telegram не возвращаются.',
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    inputSchema: {
      /** Проект с разрешённым доступом. */
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      /** Явно выбранный токен бота. */
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    },
  }, async ({ project_id, ...options }) => {
    const value = await startChatAccessCheckInDb(project_id, options);
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
  server.registerTool('db_get_chat_access_check', {
    description: 'Возвращает активную или последнюю массовую проверку доступов выбранного бота. Повторяйте, пока status равен pending, running или cancelling. job равен null, если проверок ещё не было. Не вызывает Telegram.',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    inputSchema: {
      /** Проект с разрешённым доступом. */
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      /** Явно выбранный токен бота. */
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    },
  }, async ({ project_id, ...options }) => {
    const value = await getChatAccessCheckInDb(project_id, options);
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
  /** Поиск доступен обоим транспортам и читает только сохранённый текст. */
  server.registerTool('db_search_dialog_messages', {
    description: 'Поиск буквальной подстроки без учёта регистра в сохранённых сообщениях выбранного бота. Без chat_id поиск идёт по всем чатам; для chat_id требуется chat_type. По умолчанию десять последних совпадений, порядок от новых к старым, курсор ведёт к более старым. Не вызывает Telegram; история ограничена сроком хранения.',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    inputSchema: {
      /** Проект с разрешённым доступом. */
      project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      /** Явно выбранный токен бота. */
      token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      /** Буквальная непустая подстрока. */
      query: z.string().trim().min(1).max(200),
      /** Ограничение конкретным чатом. */
      chat_id: z.string().regex(/^-?[1-9]\d{0,19}$/).optional(),
      /** Тип чата; обязателен при указании chat_id. */
      chat_type: z.enum(['private', 'group', 'supergroup', 'channel']).optional(),
      /** Размер страницы, по умолчанию десять совпадений. */
      limit: z.number().int().min(1).max(100).default(10),
      /** Продолжение поиска с теми же фильтрами. */
      cursor: z.string().max(2048).optional(),
    },
  }, async ({ project_id, ...options }) => {
    const value = await searchDialogMessagesInDb(project_id, options);
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...('error' in value ? { isError: true } : {}) };
  });
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
