/** @fileoverview Контракты перестановки столбцов, очистки, дополнения и импорта строк. */
import '../schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { TableIdParamsSchema, RowParamsSchema } from '../schemas/project-tables-params';
import { BotTableRowSchema, UpdateBotTableRowBodySchema } from '../schemas/project-tables-rows';
import { BotTableColumnListSchema } from '../schemas/project-tables-columns';
import { ConfirmBodySchema } from '../schemas/project-tables-query';
import { MessageErrorSchema } from '../schemas/common';
import { PROJECT_TABLES_AUTH_ERRORS } from './project-tables-errors';
import { TablePersistenceSchema } from '../schemas/persistence';

/**
 * Описывает существующие записи, включая обязательный confirm при замене.
 * @param registry - Реестр документации.
 * @param security - Авторизация проекта.
 * @returns Ничего.
 */
export function registerProjectTablesExtraWritePaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  const base = '/api/projects/{id}/tables/{tableId}';
  const errors = { ...PROJECT_TABLES_AUTH_ERRORS,
    400: { description: 'Отклонена валидация', content: { 'application/json': { schema: MessageErrorSchema } } },
    404: { description: 'Объект не найден в проекте', content: { 'application/json': { schema: MessageErrorSchema } } },
    500: { description: 'Ошибка базы', content: { 'application/json': { schema: MessageErrorSchema } } },
  };
  registry.registerPath({ method: 'put', path: `${base}/columns/reorder`, tags: ['project-tables'], security,
    summary: 'Изменить порядок всех столбцов', request: { params: TableIdParamsSchema,
      body: { content: { 'application/json': { schema: z.object({
        /** Полный набор ID в новом порядке. */ column_ids: z.array(z.number()),
      }) } } } }, responses: { 200: { description: 'Столбцы', content: { 'application/json': { schema: BotTableColumnListSchema } } }, ...errors },
  });
  registry.registerPath({ method: 'patch', path: `${base}/rows/{rowId}`, tags: ['project-tables'], security,
    summary: 'Дополнить отдельные ячейки строки', request: { params: RowParamsSchema,
      body: { content: { 'application/json': { schema: UpdateBotTableRowBodySchema.extend({
        /** Исходное значение каждой изменяемой ячейки для проверки конфликта. */ expected: z.record(z.string(), z.string()).optional(),
      }) } } } },
    responses: { 200: { description: 'Обновлённая строка из подтверждённой записи', content: { 'application/json': { schema: BotTableRowSchema.extend({
      /** Транзакция завершена; live-доставка проверяется отдельно. */ persistence: TablePersistenceSchema,
    }) } } }, ...errors },
  });
  registry.registerPath({ method: 'delete', path: `${base}/rows`, tags: ['project-tables'], security,
    summary: 'Очистить строки с confirm:true', request: { params: TableIdParamsSchema,
      body: { content: { 'application/json': { schema: ConfirmBodySchema } } } },
    responses: { 200: { description: 'Число удалённых строк', content: { 'application/json': { schema: z.object({
      /** Успех. */ success: z.literal(true), /** Число строк. */ deleted: z.number().int(),
    }) } } }, ...errors },
  });
  registry.registerPath({ method: 'post', path: `${base}/rows/import`, tags: ['project-tables'], security,
    summary: 'Импортировать до 200 строк', description: 'Для replace обязателен confirm:true. Все строки проверяются до записи.',
    request: { params: TableIdParamsSchema, body: { content: { 'application/json': { schema: z.object({
      /** Режим записи. */ mode: z.enum(['append', 'replace']),
      /** Подтверждение полной замены. */ confirm: z.boolean().optional(),
      /** Ячейки по ID столбца. */ rows: z.array(z.record(z.string(), z.unknown())).min(1).max(200),
    }) } } } }, responses: { 201: { description: 'Записанные строки', content: { 'application/json': { schema: z.array(BotTableRowSchema) } } }, ...errors },
  });
}
