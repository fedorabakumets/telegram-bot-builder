/**
 * @fileoverview MCP-сервер конструктора BotCraft Studio (stdio)
 * @description Тонкая обёртка над lib/bot-tools для внешних ИИ-клиентов (Cursor, Claude Desktop, Kiro)
 * @module tools/mcp-server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  addNodeToProject,
  connectNodes,
  createNode,
  generateBotCode,
  getNodeExampleTool,
  getNodeSchema,
  getPromptGuide,
  listCommands,
  listNodeTypes,
  listOperators,
  loadProject,
  removeNodeFromProject,
  saveProject,
  scaffoldMinimalProject,
  updateNodeInProject,
  updateProjectInDb,
  validateBotProject,
  validateNode,
} from '../../lib/bot-tools/index.ts';

/** Имя и версия MCP-сервера */
const SERVER_INFO = {
  name: 'botcraft-builder',
  version: '2.2.0.4',
};

/**
 * Сериализует результат тула в текстовый content-блок MCP
 * @param data - Данные для ответа
 * @returns CallToolResult content
 */
function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

/**
 * Регистрирует все инструменты конструктора на MCP-сервере
 * @param server - Экземпляр McpServer
 */
function registerTools(server: McpServer): void {
  server.registerTool(
    'list_node_types',
    { description: 'Список всех типов нод конструктора с кратким описанием' },
    async () => textResult(listNodeTypes()),
  );

  server.registerTool(
    'get_node_schema',
    {
      description: 'Схема и правила формата ноды по типу (обязательно перед созданием нод)',
      inputSchema: { type: z.string().describe('Тип ноды, например condition, message, command_trigger') },
    },
    async ({ type }) => textResult(getNodeSchema(type)),
  );

  server.registerTool(
    'get_node_example',
    {
      description: 'Эталонный пример ноды — копируй формат data отсюда',
      inputSchema: { type: z.string().describe('Тип ноды') },
    },
    async ({ type }) => textResult(getNodeExampleTool(type)),
  );

  server.registerTool(
    'list_operators',
    { description: 'Допустимые операторы condition-ноды (белый список)' },
    async () => textResult(listOperators()),
  );

  server.registerTool(
    'list_commands',
    { description: 'Стандартные команды Telegram (/start, /help и др.)' },
    async () => textResult(listCommands()),
  );

  server.registerTool(
    'get_prompt_guide',
    { description: 'Полный гайд формата project.json (docs/bot-json-prompt.md)' },
    async () => {
      const guide = getPromptGuide();
      if ('error' in guide) return textResult(guide);
      return textResult({ path: guide.path, length: guide.length, content: guide.content });
    },
  );

  server.registerTool(
    'validate_bot_project',
    {
      description: 'Валидация project.json: zod-схема + доменные правила (битые target, condition branches, дубли id)',
      inputSchema: {
        project_json: z.union([z.string(), z.record(z.unknown())]).describe('Объект project.json или JSON-строка'),
      },
    },
    async ({ project_json }) => textResult(validateBotProject(project_json)),
  );

  server.registerTool(
    'validate_node',
    {
      description: 'Валидация одной ноды',
      inputSchema: {
        node: z.record(z.unknown()).describe('Объект ноды { id, type, position, data }'),
        type: z.string().optional().describe('Ожидаемый тип для сверки'),
      },
    },
    async ({ node, type }) => textResult(validateNode(type, node)),
  );

  server.registerTool(
    'generate_bot_code',
    {
      description: 'Генерация bot.py из валидного project.json',
      inputSchema: {
        project_json: z.union([z.string(), z.record(z.unknown())]).describe('project.json'),
        bot_name: z.string().optional().describe('Имя бота для генерации'),
        skip_validation: z.boolean().optional().describe('Пропустить validate_bot_project'),
      },
    },
    async ({ project_json, bot_name, skip_validation }) =>
      textResult(generateBotCode(project_json, { botName: bot_name, skipValidation: skip_validation })),
  );

  server.registerTool(
    'create_node',
    {
      description: 'Создать одну ноду с корректными дефолтами конструктора (вызывай get_node_schema перед незнакомым типом)',
      inputSchema: {
        type: z.string().describe('Тип ноды'),
        partial_data: z.record(z.unknown()).optional().describe('Частичные поля data для merge'),
        id: z.string().optional(),
        position: z.object({ x: z.number(), y: z.number() }).optional(),
      },
    },
    async ({ type, partial_data, id, position }) =>
      textResult(createNode(type, partial_data, { id, position })),
  );

  server.registerTool(
    'scaffold_minimal_project',
    {
      description: 'Создать пустой project.json v2 со стартовой парой /start → message (или переданными нодами)',
      inputSchema: {
        sheet_name: z.string().optional().describe('Имя листа'),
        nodes: z.array(z.record(z.unknown())).optional().describe('Массив готовых нод'),
      },
    },
    async ({ sheet_name, nodes }) =>
      textResult(scaffoldMinimalProject(nodes as never, sheet_name)),
  );

  server.registerTool(
    'add_node',
    {
      description: 'Добавить ноду в project.json',
      inputSchema: {
        project_json: z.union([z.string(), z.record(z.unknown())]),
        node: z.record(z.unknown()).describe('Объект ноды'),
        sheet_id: z.string().optional(),
      },
    },
    async ({ project_json, node, sheet_id }) =>
      textResult(addNodeToProject(project_json, node as never, sheet_id)),
  );

  server.registerTool(
    'update_node',
    {
      description: 'Обновить ноду в project.json по id',
      inputSchema: {
        project_json: z.union([z.string(), z.record(z.unknown())]),
        node_id: z.string(),
        patch: z.record(z.unknown()).describe('{ position?, data?, type? }'),
        sheet_id: z.string().optional(),
      },
    },
    async ({ project_json, node_id, patch, sheet_id }) =>
      textResult(updateNodeInProject(project_json, node_id, patch as never, sheet_id)),
  );

  server.registerTool(
    'remove_node',
    {
      description: 'Удалить ноду из project.json',
      inputSchema: {
        project_json: z.union([z.string(), z.record(z.unknown())]),
        node_id: z.string(),
        sheet_id: z.string().optional(),
      },
    },
    async ({ project_json, node_id, sheet_id }) =>
      textResult(removeNodeFromProject(project_json, node_id, sheet_id)),
  );

  server.registerTool(
    'connect_nodes',
    {
      description: 'Соединить ноды: auto-transition, button-goto+branch, input-target',
      inputSchema: {
        project_json: z.union([z.string(), z.record(z.unknown())]),
        from_id: z.string(),
        to_id: z.string(),
        branch: z.string().optional().describe('id кнопки/ветки для portType=button-goto'),
        port_type: z.enum(['auto-transition', 'trigger-next', 'button-goto', 'input-target']).optional(),
        sheet_id: z.string().optional(),
      },
    },
    async ({ project_json, from_id, to_id, branch, port_type, sheet_id }) =>
      textResult(connectNodes(project_json, from_id, to_id, {
        branch,
        portType: port_type,
        sheetId: sheet_id,
      })),
  );

  server.registerTool(
    'load_project',
    {
      description: 'Прочитать project.json бота с диска (из каталога bots/)',
      inputSchema: {
        path: z.string().describe('Путь к папке бота или project.json внутри bots/, напр. "сценарий/бот" или "exchanger-monitor"'),
      },
    },
    async ({ path }) => textResult(await loadProject(path)),
  );

  server.registerTool(
    'save_project',
    {
      description: 'Записать project.json на диск в каталог bots/ (с валидацией перед записью)',
      inputSchema: {
        path: z.string().describe('Путь к папке бота или project.json внутри bots/'),
        project_json: z.union([z.string(), z.record(z.unknown())]).describe('project.json'),
        skip_validation: z.boolean().optional().describe('Пропустить валидацию перед записью'),
      },
    },
    async ({ path, project_json, skip_validation }) =>
      textResult(await saveProject(path, project_json, { skipValidation: skip_validation })),
  );

  server.registerTool(
    'update_project_db',
    {
      description: 'Записать сценарий в БД запущенного приложения и в реальном времени обновить открытый холст (live-редактирование). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        project_json: z.union([z.string(), z.record(z.unknown())]).describe('project.json'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
        skip_validation: z.boolean().optional().describe('Пропустить валидацию перед записью'),
      },
    },
    async ({ project_id, project_json, commit_message, skip_validation }) =>
      textResult(await updateProjectInDb(project_id, project_json, {
        commitMessage: commit_message,
        skipValidation: skip_validation,
      })),
  );
}

/**
 * Запускает MCP-сервер через stdio
 */
async function main(): Promise<void> {
  const server = new McpServer(SERVER_INFO);
  registerTools(server);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server failed:', error);
  process.exit(1);
});
