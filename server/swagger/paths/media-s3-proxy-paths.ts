/** @fileoverview Документация бинарного S3-прокси с проверкой проекта зарегистрированного медиа. */
import '../schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { MessageErrorSchema, UnauthorizedSchema } from '../schemas/common';
/**
 * Описывает поток объекта, не раскрывая произвольные ключи хранилища.
 * @param registry - Реестр документации.
 * @param security - Авторизация приложения.
 * @returns Ничего.
 */
export function registerMediaS3ProxyPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  /** sendStoredObject вызывает end(), поэтому тело отсутствует по контракту. */
  const emptyStorageFailure = { description: 'Хранилище не прочитано; пустое тело ответа', 'x-response-body': 'none' };
  registry.registerPath({ method: 'get', path: '/api/media/s3-proxy/{configId}/*', tags: ['media'], security,
    summary: 'Прочитать зарегистрированный приватный объект S3',
    description: 'Звёздочка — остаток пути ключа Express. Требуется запись media_files и доступ к её проекту. Content-Type определяется расширением, Cache-Control:private.',
    request: { params: z.object({ /** ID хранилища. */ configId: z.string() }) },
    responses: {
      200: { description: 'Поток байтов объекта', content: { '*/*': { schema: z.string().openapi({ format: 'binary' }) } } },
      401: { description: 'Нет авторизации', content: { 'application/json': { schema: UnauthorizedSchema } } },
      403: { description: 'Нет доступа к проекту файла', content: { 'application/json': { schema: MessageErrorSchema } } },
      404: { description: 'Объект, ключ, хранилище или запись отсутствует; JSON либо пустое тело', content: { 'application/json': { schema: MessageErrorSchema } } },
      502: emptyStorageFailure,
    },
  });
}
