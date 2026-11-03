/** @fileoverview HTTP контракты проверки личного чата и управления фоновой очередью. */
import '../schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { ChatAccessJobSchema, ChatAccessOutcomeSchema } from '../schemas/chat-access-jobs';
import { MessageErrorSchema, UnauthorizedSchema } from '../schemas/common';
/**
 * Регистрирует уже работающие маршруты проверки, без обращения к Telegram.
 * @param registry - Реестр документации.
 * @param security - Авторизация проекта.
 * @returns Ничего.
 */
export function registerChatAccessJobsPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  const base = '/api/projects/{projectId}';
  const params = z.object({ /** Проект. */ projectId: z.string() });
  const token = z.object({ /** Бот проекта. */ tokenId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER) });
  const errors = {
    400: { description: 'Некорректные параметры либо завершённая задача', content: { 'application/json': { schema: MessageErrorSchema } } },
    401: { description: 'Нет авторизации', content: { 'application/json': { schema: UnauthorizedSchema } } },
    403: { description: 'Нет доступа к проекту', content: { 'application/json': { schema: MessageErrorSchema } } },
    404: { description: 'Бот или задача не найдены в проекте', content: { 'application/json': { schema: MessageErrorSchema } } },
  };
  registry.registerPath({ method: 'post', path: `${base}/chat-access-checks`, tags: ['project-dialogs'], security,
    summary: 'Запустить фоновую проверку личных диалогов', description: 'Одна активная проверка на бота; 201 означает созданную задачу, а не завершённую проверку.',
    request: { params, body: { content: { 'application/json': { schema: token } } }, query: token.partial() },
    responses: { 201: { description: 'Созданная задача', content: { 'application/json': { schema: z.object({ /** Задача. */ job: ChatAccessJobSchema }) } } },
      409: { description: 'Проверка уже выполняется', content: { 'application/json': { schema: MessageErrorSchema } } }, ...errors },
  });
  registry.registerPath({ method: 'get', path: `${base}/chat-access-checks/active`, tags: ['project-dialogs'], security,
    summary: 'Прочитать активную или последнюю проверку бота', request: { params, query: token },
    responses: { 200: { description: 'Задача либо null', content: { 'application/json': { schema: z.object({ /** Задача. */ job: ChatAccessJobSchema.nullable() }) } } }, ...errors },
  });
  registry.registerPath({ method: 'post', path: `${base}/chat-access-checks/{jobId}/cancel`, tags: ['project-dialogs'], security,
    summary: 'Отменить оставшуюся очередь проверки', request: { params: params.extend({ /** Задача проекта. */ jobId: z.string() }) },
    responses: { 200: { description: 'Состояние cancelling либо cancelled', content: { 'application/json': { schema: z.object({ /** Задача. */ job: ChatAccessJobSchema }) } } }, ...errors },
  });
  registry.registerPath({ method: 'post', path: `${base}/dialogs/{chatId}/check-access`, tags: ['project-dialogs'], security,
    summary: 'Проверить личный чат действием typing и сохранить результат',
    request: { params: params.extend({ /** Положительный Telegram ID. */ chatId: z.string().regex(/^[1-9]\d{0,19}$/) }), query: token },
    responses: { 200: { description: 'Известный результат проверки', content: { 'application/json': { schema: ChatAccessOutcomeSchema.extend({
      /** Проверка выполнена. */ checked: z.literal(true), /** Бот заблокирован. */ blocked: z.boolean(),
    }) } } }, ...errors,
      400: { description: 'Параметры отклонены либо Telegram дал неопределённый результат', content: { 'application/json': { schema: z.union([MessageErrorSchema, ChatAccessOutcomeSchema.extend({
        /** Проверка выполнена. */ checked: z.literal(true), /** Блокировка. */ blocked: z.boolean(),
      })]) } } },
      500: { description: 'Ошибка проверки; сохранённый статус приложен, если запись удалась', content: { 'application/json': { schema: MessageErrorSchema.merge(ChatAccessOutcomeSchema.partial()) } } },
    },
  });
}
