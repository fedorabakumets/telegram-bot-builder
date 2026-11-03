/** @fileoverview Контракты настроек столбцов и атомарного изменения ячеек из общих валидаторов. */
import '../schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { tableColumnSettingsSchema } from '../../../shared/table-column-settings';
import { tableCellBatchSchema } from '../../../shared/table-cell-edit';
import { TableIdParamsSchema } from '../schemas/project-tables-params';
import { BotTableRowSchema } from '../schemas/project-tables-rows';
import { MessageErrorSchema } from '../schemas/common';
import { PROJECT_TABLES_AUTH_ERRORS } from './project-tables-errors';

/** Подтверждение записи, возвращаемое обоими обработчиками после транзакции. */
const persistence = z.object({
  /** Запись подтверждена базой данных. */
  confirmed: z.literal(true),
  /** Проект записи. */
  projectId: z.number(),
  /** Таблица записи. */
  tableId: z.number(),
});
/** Ошибки валидации, отсутствия и конфликта исходных значений. */
const errors = Object.fromEntries([400, 404, 409, 500].map((status) => [status, {
  description: status === 409 ? 'Исходное значение изменилось: вся операция отклонена' : 'Операция отклонена',
  content: { 'application/json': { schema: MessageErrorSchema } },
}]));

/**
 * Описывает существующие обработчики, сохраняя общие схемы проверки тела.
 * @param registry - Реестр документации.
 * @param security - Разрешённые способы авторизации.
 * @returns Ничего.
 */
export function registerProjectTablesSettingsPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  registry.registerPath({
    method: 'put', path: '/api/projects/{id}/tables/{tableId}/columns/{columnId}/settings',
    tags: ['project-tables'], summary: 'Сохранить тип, подпись и ограничения столбца', security,
    description: 'Внутреннее имя не меняется. Столбцы контента доступны только для чтения. min не может превышать max.',
    request: {
      params: TableIdParamsSchema.extend({
        /** Положительный идентификатор столбца. */
        columnId: z.string().regex(/^[1-9]\d*$/),
      }),
      body: { content: { 'application/json': { schema: tableColumnSettingsSchema } } },
    },
    responses: {
      200: { description: 'Проверенные настройки записаны', content: { 'application/json': { schema: z.object({
        /** Нормализованные настройки. */
        settings: tableColumnSettingsSchema,
        /** Подтверждение записи. */
        persistence,
      }) } } }, ...errors, ...PROJECT_TABLES_AUTH_ERRORS,
    },
  });
  registry.registerPath({
    method: 'post', path: '/api/projects/{id}/tables/{tableId}/cells/edit',
    tags: ['project-tables'], summary: 'Атомарно изменить до 5000 ячеек с проверкой before', security,
    request: { params: TableIdParamsSchema, body: { content: { 'application/json': { schema: tableCellBatchSchema } } } },
    responses: {
      200: { description: 'Все изменения записаны одной транзакцией', content: { 'application/json': { schema: z.object({
        /** Изменённые строки. */
        rows: z.array(BotTableRowSchema),
        /** Подтверждение записи. */
        persistence,
      }) } } }, ...errors, ...PROJECT_TABLES_AUTH_ERRORS,
    },
  });
}
