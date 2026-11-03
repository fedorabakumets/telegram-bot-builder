/** @fileoverview Описание чтения страниц истории конкретного чата. */
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { MessageErrorSchema, UnauthorizedSchema } from '../schemas/common';
import { DialogHistoryResponseSchema } from '../schemas/dialog-message-history';

/**
 * Документирует чтение истории с курсором к более старым сообщениям.
 * @param registry - Реестр API
 * @param security - Авторизация приложения
 * @returns Ничего
 */
export function registerDialogMessageHistoryPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>) {
  registry.registerPath({ method: 'get', path: '/api/projects/{projectId}/dialogs/{chatId}/messages', security,
    tags: ['Диалоги'], summary: 'Страница сохранённой истории чата',
    description: 'Только чтение БД. Первая страница содержит последние сообщения, внутри страницы порядок хронологический. next_cursor ведёт к более старым сообщениям. История ограничена сроком хранения; курсор привязан к проекту, боту, чату, типу и включению группового контекста. Данные Telegram не запрашиваются.',
    request: { params: z.object({ projectId: z.coerce.number().int().positive(), chatId: z.string().regex(/^-?[1-9]\d{0,19}$/) }),
      query: z.object({ tokenId: z.coerce.number().int().positive(), chatType: z.enum(['private', 'group', 'supergroup', 'channel']),
        limit: z.coerce.number().int().min(1).max(100).default(10), cursor: z.string().max(2048).optional(),
        includeGroupContext: z.enum(['true', 'false']).default('false') }) },
    responses: {
      200: { description: 'Страница истории с исходными чатами и безопасными метаданными вложений. Пустая страница допустима.',
        content: { 'application/json': { schema: DialogHistoryResponseSchema } } },
      400: { description: 'Некорректные параметры, курсор или групповой контекст для неличного чата', content: { 'application/json': { schema: MessageErrorSchema } } },
      401: { description: 'Требуется авторизация', content: { 'application/json': { schema: UnauthorizedSchema } } }, 403: { description: 'Нет доступа к проекту', content: { 'application/json': { schema: MessageErrorSchema } } },
      404: { description: 'Бот не принадлежит проекту', content: { 'application/json': { schema: MessageErrorSchema } } }, 500: { description: 'Не удалось прочитать историю', content: { 'application/json': { schema: MessageErrorSchema } } },
    },
  });
}
