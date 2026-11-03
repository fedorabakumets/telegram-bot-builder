/** @fileoverview Контракты документации из публичных регистраций SDK без вызова действий. */
import { McpServer, type RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { safeParseAsync } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { registerMcpTools } from '../../lib/bot-tools/mcp-register-tools';
import { describeMcpAction } from '../../lib/bot-tools/mcp-action-registry';
import { getMcpActionPolicy } from '../../lib/bot-tools/mcp-action-policy';
import { schemaExample } from './schema-example';

/** Входные инструменты не вызываются через свой каталог. */
const DISCOVERY = new Set(['list_sections', 'search_actions', 'describe_actions', 'call_action']);

/** Захватывает нормализованные контракты. @param enableFileTools - Локальные действия. @returns Контракты и проверенные структурные примеры. */
export async function readMcpDefinitions(enableFileTools: boolean) {
  const server = new McpServer({ name: 'botcraft-documentation', version: '1' });
  const registered = new Map<string, RegisteredTool>();
  const registerTool: McpServer['registerTool'] = (name, config, callback) => {
    const tool = server.registerTool(name, config, callback);
    registered.set(name, tool);
    return tool;
  };
  registerMcpTools({ registerTool } as McpServer, { enableFileTools });
  const actions = await Promise.all([...registered].filter(([id]) => !DISCOVERY.has(id)).map(async ([id, tool]) => {
    const policy = getMcpActionPolicy(id, tool._meta);
    const description = describeMcpAction({ id, section: policy.section, tool });
    const candidate = schemaExample(description.inputSchema);
    const sensitive = /"(?:password|token|api_hash|phone|code|base64|value)"/i.test(JSON.stringify(description.inputSchema));
    const parsed = !sensitive && tool.inputSchema && candidate !== undefined ? await safeParseAsync(tool.inputSchema, candidate) : undefined;
    return { ...description, policy, ...(parsed?.success ? { example: parsed.data } : tool.inputSchema ? {} : { example: {} }) };
  }));
  await server.close();
  return actions.sort((a, b) => a.id.localeCompare(b.id));
}
