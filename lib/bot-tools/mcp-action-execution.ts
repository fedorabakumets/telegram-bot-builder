/**
 * @fileoverview Вызов исходного действия с проверкой схем SDK и сохранением контекста запроса.
 */
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { safeParseAsync, getParseErrorMessage } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { McpAction } from './mcp-action-registry.ts';

/** Контекст MCP, включая отмену, авторизацию и запросы клиента. */
type ActionExtra = Parameters<ToolCallback>[0];

/**
 * Выполняет действие тем же обработчиком, что и отдельный инструмент.
 * @param action - Разрешённая регистрация из текущего профиля транспорта.
 * @param args - Аргументы, проверяемые исходной схемой.
 * @param extra - Контекст внешнего вызова MCP.
 * @returns Исходный результат обработчика после проверки выходной схемы.
 */
export async function executeMcpAction(action: McpAction, args: Record<string, unknown>, extra: ActionExtra): Promise<CallToolResult> {
  const { tool } = action;
  if (!tool.enabled) throw new Error(`Действие ${action.id} выключено`);
  if (typeof tool.handler !== 'function') throw new Error('Задачи MCP не поддерживаются универсальным вызовом');
  let parsed: unknown;
  if (tool.inputSchema) {
    const result = await safeParseAsync(tool.inputSchema, args);
    if (!result.success) throw new Error(`Некорректные аргументы ${action.id}: ${getParseErrorMessage(result.error)}`);
    parsed = result.data;
  }
  const handler = tool.handler as (...params: unknown[]) => CallToolResult | Promise<CallToolResult>;
  const result = await (tool.inputSchema ? handler(parsed, extra) : handler(extra));
  if (tool.outputSchema && !result.isError) {
    if (!result.structuredContent) throw new Error(`Действие ${action.id} не вернуло structuredContent`);
    const output = await safeParseAsync(tool.outputSchema, result.structuredContent);
    if (!output.success) throw new Error(`Некорректный результат ${action.id}: ${getParseErrorMessage(output.error)}`);
  }
  return result;
}
