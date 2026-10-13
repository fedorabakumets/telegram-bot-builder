/**
 * @fileoverview MCP графика пользовательской таблицы и подбора столбцов.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TABLE_AGGREGATIONS } from '../../shared/analytics/table-chart/types.ts';
import { getTableChartInDb, suggestTableChartInDb } from './table-chart-db.ts';

/**
 * Регистрирует чтение групп и рекомендацию без создания изображения.
 * @param server - Сервер обоих транспортов MCP.
 * @returns Ничего.
 */
export function registerTableChartTools(server: McpServer): void {
  /** Отмечает безопасную ошибку. */
  const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    ...(value && typeof value === 'object' && 'error' in value ? { isError: true } : {}) });
  const ids = {
    project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    table_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  };
  server.registerTool('db_get_table_chart', {
    description: 'Группы пользовательской таблицы для графика: количество, сумма, среднее, минимум или максимум. Не больше 50 групп. Не создаёт изображение. Таблица и столбцы должны принадлежать проекту.',
    inputSchema: { ...ids,
      x_column_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      y_column_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      aggregation: z.enum(TABLE_AGGREGATIONS).optional().describe('По умолчанию count. Для нечислового столбца сервер считает количество.'),
      limit: z.number().int().min(1).max(50).optional(),
    },
  }, async ({ project_id, table_id, x_column_id, y_column_id, aggregation, limit }) => result(await getTableChartInDb(project_id, {
    tableId: table_id, xColumnId: x_column_id, yColumnId: y_column_id, aggregation, limit,
  })));
  server.registerTool('db_suggest_table_chart', {
    description: 'Предлагает столбцы, подсчёт и вид графика пользовательской таблицы. Объясняет, если значения категории почти не повторяются или подписи слишком длинные.',
    inputSchema: ids,
  }, async ({ project_id, table_id }) => result(await suggestTableChartInDb(project_id, { tableId: table_id })));
}
