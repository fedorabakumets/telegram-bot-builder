/**
 * @fileoverview Сборка MCP-инструментов пользовательских таблиц
 * @module lib/bot-tools/mcp-register-table-tools
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTableFileTools } from './mcp-register-table-files.ts';
import { registerTableReadTools } from './mcp-register-table-read.ts';
import { registerTableWriteTools } from './mcp-register-table-write.ts';

/**
 * Регистрирует чтение и изменение. Файлы — только если включены файловые инструменты
 * @param server - MCP-сервер
 * @param enableFileTools - true для локального stdio
 */
export function registerTableTools(server: McpServer, enableFileTools: boolean): void {
  registerTableReadTools(server);
  registerTableWriteTools(server);
  if (enableFileTools) registerTableFileTools(server);
}
