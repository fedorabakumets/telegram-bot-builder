/**
 * @fileoverview Точка входа MCP-сервера конструктора (stdio)
 * @description Запускает botcraft-builder через StdioServerTransport для Cursor / Claude / Kiro.
 * @module tools/mcp-server
 */

import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createBotcraftMcpServer } from '../../lib/bot-tools/mcp-register-tools.ts';

/**
 * Запускает MCP-сервер через stdio (с файловыми load/save)
 */
async function main(): Promise<void> {
  const server = createBotcraftMcpServer({ enableFileTools: true });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server failed:', error);
  process.exit(1);
});
