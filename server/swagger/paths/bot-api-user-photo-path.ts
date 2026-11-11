/** @fileoverview OpenAPI потоковой фотографии пользователя через авторизованный API бота. */
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { BotApiCookiesSchema, BotApiTelegramIdQuerySchema } from '../schemas/bot-api';
import { BotApiTokenUserParamsSchema } from '../schemas/bot-api-runtime';
import { BOT_API_AUTH_DOC } from './bot-api-auth-doc';
import { BOT_API_CRUD_ERRORS } from './bot-api-responses';

/**
 * Регистрирует защищённую загрузку фотографии для другого бота.
 * @param registry - Реестр OpenAPI.
 * @param security - Способы авторизации.
 * @returns Завершение регистрации.
 */
export function registerBotApiUserPhotoPath(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  registry.registerPath({
    method: 'get', path: '/api/bot/tokens/{tokenId}/users/{userId}/photo', tags: ['bot'], security,
    summary: 'Скачать фотографию пользователя без сохранения на сервере',
    description: BOT_API_AUTH_DOC + 'Проверяет доступ к токену и наличие пользователя, получает file_id и передаёт файл потоком. ' +
      'Ссылка требует сессию/PAT; Telegram не сможет скачать её без авторизации. Другой бот должен загрузить байты с Bearer, ' +
      'затем отправить как новый файл. Отсутствующая фотография возвращает 404. Общая квота со списком и карточкой.',
    request: { cookies: BotApiCookiesSchema, params: BotApiTokenUserParamsSchema, query: BotApiTelegramIdQuerySchema.partial() },
    responses: {
      200: { description: 'Поток изображения', content: { 'application/octet-stream': { schema: z.string().openapi({ format: 'binary' }) } } },
      206: { description: 'Запрошенный диапазон файла' },
      416: { description: 'Диапазон недоступен' },
      429: { description: 'Превышена общая квота пользователей бота; повторить после Retry-After' },
      ...BOT_API_CRUD_ERRORS,
    },
  });
}
