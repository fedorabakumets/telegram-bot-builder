/** @fileoverview Импорт встроенного пакета таблиц по общему валидатору файлового формата. */
import '../schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { tableBundleSchema } from '../../../shared/table-bundle-schema';
import { DatabaseProjectIdParamsSchema } from '../schemas/database';
import { MessageErrorSchema } from '../schemas/common';
import { PROJECT_TABLES_AUTH_ERRORS } from './project-tables-errors';

/**
 * Регистрирует атомарный импорт всех таблиц существующего обработчика.
 * @param registry - Реестр документации.
 * @param security - Авторизация проекта.
 * @returns Ничего.
 */
export function registerProjectTablesImportPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  registry.registerPath({ method: 'post', path: '/api/projects/{id}/tables/import', tags: ['project-tables'], security,
    summary: 'Импортировать встроенный пакет таблиц одной транзакцией',
    description: 'До 50 таблиц по 200 строк. Для mode=replace обязателен confirm:true. Совпадение ширины строк и уникальность имён проверяются общим контрактом.',
    request: { params: DatabaseProjectIdParamsSchema, body: { content: { 'application/json': { schema: tableBundleSchema.and(z.object({
      /** Создать новые или заменить одноимённые. */ mode: z.enum(['create', 'replace']),
      /** Подтверждение необратимой замены. */ confirm: z.boolean().optional(),
    })) } } } }, responses: {
      201: { description: 'Все таблицы записаны после COMMIT', content: { 'application/json': { schema: z.object({
        /** Общая транзакция завершена. */ ok: z.literal(true),
        /** Счётчики каждой таблицы. */ tables: z.array(z.object({
          /** Имя таблицы. */ name: z.string(), /** Идентификатор. */ tableId: z.number(), /** Записано строк. */ rowCount: z.number().int(),
        })),
        /** Подтверждение сохранения. */ persistence: z.object({
          /** Все записи подтверждены. */ confirmed: z.literal(true), /** Проект. */ projectId: z.number(),
        }),
      }) } } },
      400: { description: 'Проверка формы или откат всего пакета', content: { 'application/json': { schema: MessageErrorSchema.extend({
        /** Необязательный индекс таблицы, приведшей к отказу. */ failed_table_index: z.number().int().optional(),
      }) } } },
      500: { description: 'Ошибка базы', content: { 'application/json': { schema: MessageErrorSchema } } },
      ...PROJECT_TABLES_AUTH_ERRORS,
    },
  });
}
