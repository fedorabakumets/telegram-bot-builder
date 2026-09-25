/**
 * @fileoverview Запуск сгенерированного OpenAPI→MCP (stdio) с маппингом env
 * @description MCP_AGENT_TOKEN → BEARER_TOKEN_AGENTTOKEN; API_BASE_URL из .env.
 * Импортирует tools/mcp-openapi/generated/src/index.ts (stdio MCP).
 * @module tools/mcp-openapi/start
 */

import 'dotenv/config';

/**
 * Выставляет env и поднимает generated MCP
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const token = process.env.MCP_AGENT_TOKEN?.trim();
  if (!token) {
    console.error(
      'MCP_AGENT_TOKEN не задан. Добавьте в .env (вкладка «Агент») и envFile в mcp.json.',
    );
    process.exit(1);
  }

  process.env.API_BASE_URL = process.env.API_BASE_URL?.trim() || 'http://localhost:5000';
  process.env.BEARER_TOKEN_AGENTTOKEN = token;

  // side-effect: подключение StdioServerTransport
  await import('./generated/src/index.ts');
}

main().catch((err) => {
  console.error('Не удалось запустить openapi MCP:', err);
  process.exit(1);
});
