/** @fileoverview Контракты трёх защищённых операций управления собственными сессиями. */
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { ProfileSessionsSchema, SessionRevokedSchema, OtherSessionsRevokedSchema, SessionRegistryErrorSchema, SessionUnauthorizedSchema } from '../schemas/profile-sessions';
/** Создаёт JSON-ответ. @param description - Описание. @param schema - Схема. @returns Ответ OpenAPI. */
function json(description: string, schema: z.ZodTypeAny) { return { description, content: { 'application/json': { schema } } }; }
/** Регистрирует сессии после базовых auth-маршрутов. @param registry - Реестр. @returns Завершение регистрации. */
export function registerProfileSessionPaths(registry: OpenAPIRegistry): void {
  const security = [{ cookieAuth: [] }, { agentToken: [] }];
  const errors = { 401: json('Требуется авторизация', SessionUnauthorizedSchema), 503: json('Реестр сессий недоступен', SessionRegistryErrorSchema) };
  registry.registerPath({ method: 'get', path: '/api/profile/sessions', tags: ['auth'], summary: 'Список активных сессий',
    description: 'Сессии текущего пользователя; внутренний sessionId/connect.sid исключён.', security,
    responses: { 200: json('Публичные сессии', ProfileSessionsSchema), ...errors } });
  registry.registerPath({ method: 'delete', path: '/api/profile/sessions/{id}', tags: ['auth'], summary: 'Завершить другую сессию', security,
    request: { params: z.object({ id: z.string().openapi({ description: 'Публичный идентификатор сессии' }) }) },
    responses: { 200: json('Сессия завершена', SessionRevokedSchema), 404: json('Не найдена либо является текущей', SessionRegistryErrorSchema), ...errors } });
  registry.registerPath({ method: 'delete', path: '/api/profile/sessions', tags: ['auth'], summary: 'Завершить остальные сессии', security,
    responses: { 200: json('Число завершённых сессий', OtherSessionsRevokedSchema), ...errors } });
}
