/**
 * @fileoverview Четыре инструмента поиска контрактов и выполнения зарегистрированных действий.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { describeMcpAction, type McpAction } from './mcp-action-registry.ts';
import { executeMcpAction } from './mcp-action-execution.ts';

/**
 * Упаковывает данные каталога в совместимый ответ MCP.
 * @param data - Машиночитаемые данные.
 * @returns Текстовое представление результата.
 */
function result(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

/**
 * Регистрирует каталог и универсальный вызов; компактный профиль удаляет отдельные инструменты.
 * @param server - Настоящий MCP-сервер до подключения транспорта.
 * @param registry - Каталог исходных регистраций текущего транспорта.
 * @param profile - Профиль публикуемых инструментов.
 */
export function registerMcpActionTools(server: McpServer, registry: Map<string, McpAction>, profile: 'full' | 'compact' = 'full'): void {
  if (profile === 'compact') for (const action of registry.values()) action.tool.remove();
  const available = () => [...registry.values()].filter(action => action.tool.enabled);
  server.registerTool('list_sections', { description: 'Разделы доступных действий BotCraft и количество действий. Начинай поиск возможностей здесь.' }, async () => {
    const sections = new Map<string, number>();
    for (const action of available()) sections.set(action.section, (sections.get(action.section) ?? 0) + 1);
    return result({ sections: [...sections].map(([id, count]) => ({ id, count })) });
  });
  server.registerTool('search_actions', {
    description: 'Найти действия по имени, русскому описанию или разделу; затем получи точные схемы через describe_actions.',
    inputSchema: {
      query: z.string().max(500).default(''), section: z.string().optional(),
      cursor: z.string().regex(/^\d+$/).optional(), limit: z.number().int().min(1).max(100).default(20),
    },
  }, async ({ query, section, cursor, limit }) => {
    const words = query.toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
    const matches = available().filter(action => (!section || action.section === section)
      && words.every(word => `${action.id} ${action.section} ${action.tool.description ?? ''}`.toLocaleLowerCase('ru').includes(word)))
      .sort((a, b) => a.id.localeCompare(b.id));
    const offset = Number(cursor ?? 0);
    if (!Number.isSafeInteger(offset)) throw new Error('Некорректный курсор');
    return result({ actions: matches.slice(offset, offset + limit).map(action => ({ id: action.id, section: action.section, description: action.tool.description })),
      total: matches.length, next_cursor: offset + limit < matches.length ? String(offset + limit) : null });
  });
  server.registerTool('describe_actions', {
    description: 'Точные входные и выходные JSON-схемы разрешённых действий. Обязательно изучи схему перед незнакомым вызовом.',
    inputSchema: { ids: z.array(z.string()).min(1).max(20) },
  }, async ({ ids }) => result({ actions: ids.map(id => {
    const action = registry.get(id);
    if (!action?.tool.enabled) throw new Error(`Неизвестное действие: ${id}`);
    return describeMcpAction(action);
  }) }));
  server.registerTool('call_action', {
    description: 'Выполнить разрешённое действие BotCraft по ID с проверкой исходной схемы. Сохраняет авторизацию и ограничения исходного инструмента.',
    inputSchema: { action_id: z.string(), args: z.record(z.unknown()).default({}) },
  }, async ({ action_id, args }, extra) => {
    const action = registry.get(action_id);
    if (!action) throw new Error(`Неизвестное действие: ${action_id}`);
    return executeMcpAction(action, args, extra);
  });
}
