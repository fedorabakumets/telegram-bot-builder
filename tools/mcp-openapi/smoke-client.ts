/** @fileoverview Изолированный smoke stdio-клиента OpenAPI: только tools/list, без HTTP-вызовов и рабочих ключей. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Проверяет реально запущенный wrapper и совпадение опубликованных ID с безопасным подмножеством.
 * @returns Завершение проверки; процесс закрывается также при ошибке
 */
async function main(): Promise<void> {
  const spec = JSON.parse(await readFile(resolve('tools/mcp-openapi/openapi.mcp.json'), 'utf8'));
  const expected = Object.values(spec.paths).flatMap((path: any) => Object.values(path)
    .filter((operation: any) => operation && typeof operation === 'object' && typeof operation.operationId === 'string')
    .map((operation: any) => operation.operationId)).sort();
  const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  const transport = new StdioClientTransport({ command: process.execPath,
    args: ['--import', 'tsx', resolve('tools/mcp-openapi/start.ts')], stderr: 'pipe',
    env: { ...env, MCP_AGENT_TOKEN: 'isolated-tools-list-only', API_BASE_URL: 'http://127.0.0.1:1',
      TSX_TSCONFIG_PATH: resolve('tools/mcp-openapi/tsconfig.json') } });
  const client = new Client({ name: 'openapi-smoke', version: '1' });
  try {
    await client.connect(transport);
    const actual = (await client.listTools()).tools.map(tool => tool.name).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected) || actual.length !== 5) {
      throw new Error('tools/list не совпадает с пятью проверенными операциями OpenAPI');
    }
    console.info(JSON.stringify({ checked: 'OpenAPI stdio tools/list', tools: actual.length, httpCalls: 0 }));
  } finally { await client.close(); await transport.close(); }
}

await main();
