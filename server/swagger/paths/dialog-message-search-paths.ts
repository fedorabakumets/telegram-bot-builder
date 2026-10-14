/** @fileoverview Публичный контракт буквального поиска сохранённых сообщений. */
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { DialogHistoryMessageSchema } from '../schemas/dialog-message-history';

/**
 * Регистрирует поиск от новых сообщений к старым без запросов Telegram.
 * @param registry - Реестр API
 * @param security - Авторизация приложения
 * @returns Ничего
 */
export function registerDialogMessageSearchPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>) {
  registry.registerPath({ method: 'get', path: '/api/projects/{projectId}/dialogs/messages/search', security,
    tags: ['Диалоги'], summary: 'Поиск по сохранённым сообщениям бота',
    description: 'Буквальная подстрока без регистра, включая %, _ и обратную косую черту. Без chatId поиск по всем чатам; chatType допустим как самостоятельный фильтр. Для chatId требуется chatType. Порядок от новых к старым; курсор привязан к проекту, токену, запросу и фильтрам. Только сохранённый текст, без Telegram.',
    request: { params: z.object({ projectId: z.coerce.number().int().positive() }),
      query: z.object({
        /** Токен выбранного бота. */
        tokenId: z.coerce.number().int().positive(),
        /** Непустая буквальная подстрока. */
        query: z.string().trim().min(1).max(200),
        /** Ограничение конкретным чатом. */
        chatId: z.string().regex(/^-?[1-9]\d{0,19}$/).optional(),
        /** Тип чата, обязательный при указании chatId. */
        chatType: z.enum(['private', 'group', 'supergroup', 'channel']).optional(),
        /** Размер страницы. */
        limit: z.coerce.number().int().min(1).max(100).default(10),
        /** Продолжение к более старым совпадениям. */
        cursor: z.string().max(2048).optional(),
      }) },
    responses: {
      200: { description: 'Совпадения от новых к старым с полным текстом и безопасными метаданными.',
        content: { 'application/json': { schema: z.object({
          /** Признак успешного чтения. */
          ok: z.literal(true),
          /** Проект. */
          project_id: z.number().int().positive(),
          /** Выбранный бот. */
          token_id: z.number().int().positive(),
          /** Нормализованный поисковый текст. */
          query: z.string(),
          /** Фильтр чата или отсутствие фильтра. */
          chat_id: z.string().nullable(),
          /** Фильтр типа чата или отсутствие фильтра. */
          chat_type: z.enum(['private', 'group', 'supergroup', 'channel']).nullable(),
          /** Страница совпадений. */
          messages: z.array(DialogHistoryMessageSchema),
          /** Есть ли продолжение. */
          has_more: z.boolean(),
          /** Курсор следующей страницы. */
          next_cursor: z.string().nullable(),
        }) } } },
      400: { description: 'Некорректные параметры или курсор' },
      401: { description: 'Требуется авторизация' }, 403: { description: 'Нет доступа к проекту' },
      404: { description: 'Бот не принадлежит проекту' }, 500: { description: 'Не удалось выполнить поиск' },
    },
  });
}
