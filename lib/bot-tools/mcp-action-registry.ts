/**
 * @fileoverview Каталог действий из реальных публичных регистраций MCP без копирования контрактов.
 */
import type { McpServer, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { toJsonSchemaCompat } from '@modelcontextprotocol/sdk/server/zod-json-schema-compat.js';
import { getMcpActionPolicy } from './mcp-action-policy.ts';
import { normalizeMcpActionResult } from './mcp-action-result.ts';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { actionOutputSchema } from './mcp-output-contract.ts';

/** Зарегистрированное действие конструктора. */
export interface McpAction {
  /** Стабильный идентификатор существующего инструмента. */
  id: string;
  /** Раздел каталога. */
  section: string;
  /** Публичная регистрация SDK с исходным обработчиком и схемами. */
  tool: RegisteredTool;
}

/**
 * Создаёт фасад регистрации, сохраняющий публичные результаты SDK.
 * @param server - Реальный сервер до подключения транспорта.
 * @returns Фасад и единый каталог доступных действий.
 */
export function createMcpActionRegistry(server: McpServer) {
  const actions = new Map<string, McpAction>();
  const registerTool: McpServer['registerTool'] = (name, config, callback) => {
    const policy = getMcpActionPolicy(name, config._meta);
    /** Учитывает явное объявление разрушительности новых регистраций в едином каталоге. */
    policy.destructive = config.annotations?.destructiveHint ?? policy.destructive;
    /** Сохраняет сигнатуру SDK, включая контекст и обработчики без входной схемы. */
    const invoke = callback as (...args: unknown[]) => CallToolResult | Promise<CallToolResult>;
    const wrapped = (async (...args: unknown[]) => normalizeMcpActionResult(await invoke(...args), policy, !config.outputSchema)) as typeof callback;
    const tool = server.registerTool(name, { ...config,
      /** Существующий точный контракт не подменяется общей оболочкой. */
      outputSchema: config.outputSchema ?? actionOutputSchema,
      annotations: { readOnlyHint: ['read', 'prepare'].includes(policy.effect), destructiveHint: policy.destructive,
        openWorldHint: policy.effect === 'external', ...config.annotations },
      _meta: { ...config._meta, botcraft: policy } }, wrapped);
    actions.set(name, { id: name, section: policy.section, tool });
    return tool;
  };
  // Существующие модули регистрации используют только публичный registerTool.
  const facade = { registerTool } as McpServer;
  return { actions, facade };
}

/**
 * Возвращает точный контракт действия в формате tools/list текущего SDK.
 * @param action - Действие из реестра.
 * @returns Машиночитаемое описание без обработчика.
 */
export function describeMcpAction(action: McpAction) {
  const { tool } = action;
  return {
    id: action.id, section: action.section, title: tool.title, description: tool.description,
    inputSchema: tool.inputSchema
      ? toJsonSchemaCompat(tool.inputSchema, { strictUnions: true, pipeStrategy: 'input' })
      : { type: 'object', properties: {} },
    ...(tool.outputSchema ? { outputSchema: toJsonSchemaCompat(tool.outputSchema,
      { strictUnions: true, pipeStrategy: 'output' }) } : {}),
    annotations: tool.annotations, execution: tool.execution, _meta: tool._meta,
  };
}
