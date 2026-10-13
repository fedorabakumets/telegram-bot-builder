/**
 * @fileoverview Регистрация инструментов ограниченного чтения и экспорта логов.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listBotLaunchesInDb, getLaunchLogsInDb } from './bot-launch-pages-db.ts';
import { searchBotLogsInDb } from './bot-log-search-db.ts';
import { exportBotLogsInDb } from './bot-log-export-db.ts';

/**
 * Регистрирует четыре инструмента логов с ограничениями размера ответа.
 * @param server - Общий сервер MCP
 * @param enableFileTools - Разрешает локальный экспорт только для транспорта stdio
 * @returns Ничего
 */
export function registerBotLogTools(server: McpServer, enableFileTools = false): void {
  /** Преобразует безопасный результат API в ответ MCP. */
  const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }] });
  /** Общие поля поиска периода и курсора. */
  const range = {
    project_id: z.number().int().positive(), token_id: z.number().int().positive(),
    from: z.string().datetime({ offset: true }), to: z.string().datetime({ offset: true }),
    text: z.string().max(500).optional(), type: z.enum(['stdout', 'stderr', 'status']).optional(),
    before_id: z.number().int().positive().optional(),
  };
  server.registerTool('db_list_bot_launches', {
    description: 'Страница истории запусков токена; before_id читает более старые запуски. Доступ проверяется по проекту.',
    inputSchema: { token_id: z.number().int().positive(), limit: z.number().int().min(1).max(100).optional(), before_id: range.before_id },
  }, async ({ token_id, limit, before_id }) => result(await listBotLaunchesInDb(token_id, { limit, beforeId: before_id })));
  server.registerTool('db_get_launch_logs', {
    description: 'Логи одного запуска по launch_id, до 500 строк, более старые страницы через before_id.',
    inputSchema: { launch_id: z.number().int().positive(), limit: z.number().int().min(1).max(500).optional(), before_id: range.before_id },
  }, async ({ launch_id, limit, before_id }) => result(await getLaunchLogsInDb(launch_id, { limit, beforeId: before_id })));
  server.registerTool('db_search_bot_logs', {
    description: 'Поиск сохранённых логов бота по ISO-периоду, тексту и типу. История ограничена сроком хранения.',
    inputSchema: { ...range, limit: z.number().int().min(1).max(1000).optional() },
  }, async ({ project_id, token_id, before_id, ...options }) => result(await searchBotLogsInDb(project_id, token_id, { ...options, beforeId: before_id })));
  if (!enableFileTools) return;
  server.registerTool('db_export_bot_logs', {
    description: 'Экспорт периода логов в локальный файл txt/jsonl, до 5000 строк. Возвращает путь и признак неполного экспорта.',
    inputSchema: { ...range, format: z.enum(['txt', 'jsonl']).optional(), max_rows: z.number().int().min(1).max(5000).optional() },
  }, async ({ project_id, token_id, before_id, max_rows, ...options }) => result(await exportBotLogsInDb(project_id, token_id, { ...options, beforeId: before_id, maxRows: max_rows })));
}
