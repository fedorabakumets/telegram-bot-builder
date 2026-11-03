/** @fileoverview Контракты чтения строки, сводки и подсчёта пользовательских таблиц. */
import '../schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { TableIdParamsSchema, RowParamsSchema } from '../schemas/project-tables-params';
import { BotTableRowSchema } from '../schemas/project-tables-rows';
import { QueryTableRowsBodySchema } from '../schemas/project-tables-query';
import { TableSummarySchema } from '../schemas/project-tables-results';
import { MessageErrorSchema } from '../schemas/common';
import { PROJECT_TABLES_AUTH_ERRORS } from './project-tables-errors';

/**
 * Регистрирует существующие операции без изменения их поведения.
 * @param registry - Реестр контрактов.
 * @param security - Авторизация проекта.
 * @returns Ничего.
 */
export function registerProjectTablesExtraReadPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  const base = '/api/projects/{id}/tables/{tableId}';
  const errors = { ...PROJECT_TABLES_AUTH_ERRORS,
    400: { description: 'Неверные параметры', content: { 'application/json': { schema: MessageErrorSchema } } },
    404: { description: 'Таблица или строка не найдена в проекте', content: { 'application/json': { schema: MessageErrorSchema } } },
    500: { description: 'Ошибка базы', content: { 'application/json': { schema: MessageErrorSchema } } },
  };
  registry.registerPath({ method: 'get', path: `${base}/rows/{rowId}`, tags: ['project-tables'], security,
    summary: 'Получить строку таблицы', request: { params: RowParamsSchema },
    responses: { 200: { description: 'Строка', content: { 'application/json': { schema: BotTableRowSchema } } }, ...errors },
  });
  registry.registerPath({ method: 'get', path: `${base}/summary`, tags: ['project-tables'], security,
    summary: 'Заполненность столбцов и число строк', request: { params: TableIdParamsSchema },
    responses: { 200: { description: 'Сводка', content: { 'application/json': { schema: TableSummarySchema } } }, ...errors },
  });
  registry.registerPath({ method: 'post', path: `${base}/rows/count`, tags: ['project-tables'], security,
    summary: 'Посчитать строки с фильтрами', request: { params: TableIdParamsSchema,
      body: { content: { 'application/json': { schema: QueryTableRowsBodySchema } } } },
    responses: { 200: { description: 'Число подходящих строк', content: { 'application/json': { schema: z.object({
      /** Количество строк. */ total: z.number().int(),
    }) } } }, ...errors },
  });
}
