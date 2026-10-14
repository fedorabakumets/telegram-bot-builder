/** @fileoverview Описание API чтения диалогов выбранного бота. */
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { ProjectDialogsResponseSchema } from '../schemas/project-dialogs';

/**
 * Документирует фильтры, пагинацию и сохранённое состояние доступа.
 * @param registry - Реестр API
 * @param security - Авторизация cookie или PAT
 * @returns Ничего
 */
export function registerProjectDialogsPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>) {
  registry.registerPath({ method: 'get', path: '/api/projects/{projectId}/dialogs', security,
    summary: 'Список диалогов выбранного бота', tags: ['Диалоги'],
    description: 'Читает сохранённые диалоги без запросов Telegram. Личные карточки требуют личных сообщений выбранного бота; групповые сообщения не меняют их превью и порядок. Статус доступа — последняя проверка, счётчик — сохранённые сообщения. Курсор привязан к проекту, токену, виду и поиску; при новых сообщениях снимок выдачи не гарантируется.',
    request: { params: z.object({ projectId: z.coerce.number().int().positive() }),
      query: z.object({ tokenId: z.coerce.number().int().positive(),
        kind: z.enum(['all', 'users', 'groups', 'channels']).default('all'),
        search: z.string().max(200).optional(), limit: z.coerce.number().int().min(1).max(100).default(10),
        cursor: z.string().max(2048).optional() }) },
    responses: {
      200: { description: 'Страница диалогов и сохранённые проверки доступа',
        content: { 'application/json': { schema: ProjectDialogsResponseSchema } } },
      400: { description: 'Некорректные параметры или курсор' },
      401: { description: 'Требуется авторизация' },
      403: { description: 'Нет доступа к проекту' },
      404: { description: 'Бот не принадлежит проекту' },
      500: { description: 'Не удалось прочитать диалоги' },
    },
  });
}
