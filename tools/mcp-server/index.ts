/**
 * @fileoverview MCP-сервер конструктора BotCraft Studio (stdio)
 * @description Тонкая обёртка над lib/bot-tools для внешних ИИ-клиентов (Cursor, Claude Desktop, Kiro)
 * @module tools/mcp-server
 */

// Загружаем переменные окружения из .env, чтобы MCP-процесс видел API_BASE_URL и
// персональный токен агента MCP_AGENT_TOKEN (mcp.json не трогаем — токен лежит в .env).
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  addNodeInDb,
  addNodeToProject,
  applyOpsInDb,
  connectNodes,
  connectNodesInDb,
  disconnectNodesInDb,
  createNode,
  fetchProjectFromDb,
  findNodesInDb,
  generateBotCode,
  getNodeExampleTool,
  getNodeFromDb,
  getNodeSchema,
  getPromptGuide,
  listCommands,
  listNodeTypes,
  listNodesInDb,
  listConnectionsInDb,
  listOperators,
  listProjectsInDb,
  createProjectInDb,
  renameProjectInDb,
  reorderProjectsInDb,
  exportProjectInDb,
  deleteProjectInDb,
  listVersionsInDb,
  loadProject,
  removeNodeFromProject,
  removeNodeInDb,
  moveNodeInDb,
  duplicateNodeInDb,
  addSheetInDb,
  duplicateSheetInDb,
  renameSheetInDb,
  removeSheetInDb,
  restoreVersionInDb,
  deleteVersionInDb,
  pruneVersionsInDb,
  setActiveSheetInDb,
  listSheetsInDb,
  reorderSheetsInDb,
  moveSheetToProjectInDb,
  saveProject,
  scaffoldMinimalProject,
  summarizeProjectFromDb,
  updateNodeInProject,
  updateNodeInDb,
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

  server.registerTool(
    'db_add_node',
    {
      description: 'Добавить ноду в проект в БД живого приложения с обновлением холста (live). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        node: z.record(z.unknown()).describe('Объект ноды'),
        sheet_id: z.string().optional(),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, node, sheet_id, commit_message }) =>
      textResult(await addNodeInDb(project_id, node as never, sheet_id, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_update_node',
    {
      description: 'Обновить ноду по id в проекте в БД живого приложения с обновлением холста (live). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        node_id: z.string(),
        patch: z.record(z.unknown()).describe('{ position?, data?, type? }'),
        sheet_id: z.string().optional(),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, node_id, patch, sheet_id, commit_message }) =>
      textResult(await updateNodeInDb(project_id, node_id, patch as never, sheet_id, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_remove_node',
    {
      description: 'Удалить ноду из проекта в БД живого приложения с обновлением холста (live). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        node_id: z.string(),
        sheet_id: z.string().optional(),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, node_id, sheet_id, commit_message }) =>
      textResult(await removeNodeInDb(project_id, node_id, sheet_id, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_connect_nodes',
    {
      description: 'Соединить ноды (auto-transition, button-goto+branch, input-target) в проекте в БД живого приложения с обновлением холста (live). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        from_id: z.string(),
        to_id: z.string(),
        branch: z.string().optional().describe('id кнопки/ветки для portType=button-goto'),
        port_type: z.enum(['auto-transition', 'trigger-next', 'button-goto', 'input-target']).optional(),
        sheet_id: z.string().optional(),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, from_id, to_id, branch, port_type, sheet_id, commit_message }) =>
      textResult(await connectNodesInDb(project_id, from_id, to_id, {
        branch,
        portType: port_type,
        sheetId: sheet_id,
      }, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_disconnect_nodes',
    {
      description: 'Снять переход между нодами в проекте в БД живого приложения с обновлением холста (live). Без branch снимает все рёбра from→to; с branch — только указанную кнопку/ветку. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        from_id: z.string(),
        to_id: z.string(),
        branch: z.string().optional().describe('id кнопки/ветки — снять только её'),
        sheet_id: z.string().optional(),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, from_id, to_id, branch, sheet_id, commit_message }) =>
      textResult(await disconnectNodesInDb(project_id, from_id, to_id, {
        branch,
        sheetId: sheet_id,
      }, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_move_node',
    {
      description: 'Перенести ноду на другой лист проекта в БД живого приложения с обновлением холста (live). id и связи сохраняются. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        node_id: z.string().describe('ID переносимой ноды'),
        to_sheet_id: z.string().describe('ID целевого листа'),
        from_sheet_id: z.string().optional().describe('ID исходного листа (по умолчанию автопоиск)'),
        position: z.object({ x: z.number(), y: z.number() }).optional().describe('Новая позиция на целевом листе (по умолчанию сохраняется текущая)'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, node_id, to_sheet_id, from_sheet_id, position, commit_message }) =>
      textResult(await moveNodeInDb(project_id, node_id, to_sheet_id, { fromSheetId: from_sheet_id, position }, { commitMessage: commit_message })),
  );

  server.registerTool(
    'db_duplicate_node',
    {
      description: 'Дублировать ноду на том же листе в БД живого приложения с обновлением холста (live). Копия получает новый id и смещённую позицию; исходящие связи сохраняются как у оригинала. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        node_id: z.string().describe('ID дублируемой ноды'),
        position: z.object({ x: z.number(), y: z.number() }).optional().describe('Позиция копии (по умолчанию смещение +40/+40 от оригинала)'),
        sheet_id: z.string().optional().describe('ID листа (по умолчанию активный/первый)'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, node_id, position, sheet_id, commit_message }) =>
      textResult(await duplicateNodeInDb(project_id, node_id, { position, sheetId: sheet_id }, { commitMessage: commit_message })),
  );

  server.registerTool(
    'get_project_db',
    {
      description: 'Прочитать весь сценарий проекта из БД живого приложения (тяжёлый: возвращает полный BotDataWithSheets). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
      },
    },
    async ({ project_id }) => textResult(await fetchProjectFromDb(project_id)),
  );

  server.registerTool(
    'db_project_summary',
    {
      description: 'Лёгкая сводка проекта из БД живого приложения: листы, число нод, счётчик по типам (без data нод)',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
      },
    },
    async ({ project_id }) => textResult(await summarizeProjectFromDb(project_id)),
  );

  server.registerTool(
    'db_list_projects',
    {
      description: 'Список проектов владельца токена из БД живого приложения: id, name, число нод/листов, дата. БЕЗ project_id — единственный тул для дискавери: по нему узнаёшь id проектов для остальных db_-тулов. Read-only.',
    },
    async () => textResult(await listProjectsInDb()),
  );

  server.registerTool(
    'db_create_project',
    {
      description: 'Создать новый проект с дефолтным сценарием (/start → приветствие) в БД живого приложения. Возвращает id нового проекта.',
      inputSchema: { name: z.string().describe('Название нового проекта') },
    },
    async ({ name }) => textResult(await createProjectInDb(name)),
  );

  server.registerTool(
    'db_rename_project',
    {
      description: 'Переименовать проект в БД живого приложения. Меняет только имя (без правки сценария, без новой версии).',
      inputSchema: { project_id: z.number(), name: z.string() },
    },
    async ({ project_id, name }) => textResult(await renameProjectInDb(project_id, name)),
  );

  server.registerTool(
    'db_reorder_projects',
    {
      description: 'Изменить порядок проектов в списке. project_ids — полный список id проектов владельца в нужном порядке.',
      inputSchema: { project_ids: z.array(z.number()).describe('Полный список id проектов в нужном порядке') },
    },
    async ({ project_ids }) => textResult(await reorderProjectsInDb(project_ids)),
  );

  server.registerTool(
    'db_export_project',
    {
      description: 'Экспортировать проект в готовый Python-код бота (bot.py): сохраняет файл на диск в каталог bots/ и возвращает путь, размер, число строк и превью (а не весь код — чтобы не раздувать контекст). Полный код — флаг inline:true или чтение файла.',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        save_path: z.string().optional().describe('Папка или путь к .py внутри bots/ (по умолчанию bots/exported/project_<id>/bot.py)'),
        inline: z.boolean().optional().describe('Вернуть и полный код в ответе (по умолчанию только путь+превью)'),
      },
    },
    async ({ project_id, save_path, inline }) =>
      textResult(await exportProjectInDb(project_id, { savePath: save_path, inline })),
  );

  server.registerTool(
    'db_delete_project',
    {
      description: 'Удалить проект целиком (НЕОБРАТИМО): останавливает бота и удаляет все связанные данные. Требует confirm: true.',
      inputSchema: { project_id: z.number(), confirm: z.boolean().describe('Обязательное подтверждение необратимого удаления') },
    },
    async ({ project_id, confirm }) => textResult(await deleteProjectInDb(project_id, { confirm })),
  );

  server.registerTool(
    'db_list_nodes',
    {
      description: 'Лёгкий список нод проекта из БД живого приложения: id, type, лист, краткая сводка (без полного data)',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        sheet_id: z.string().optional().describe('ID листа (по умолчанию все листы)'),
      },
    },
    async ({ project_id, sheet_id }) => textResult(await listNodesInDb(project_id, sheet_id)),
  );

  server.registerTool(
    'db_find_nodes',
    {
      description: 'Поиск нод проекта в БД живого приложения по подстроке (в тексте/команде/имени/переменной/id) и опционально по типу ноды. Read-only. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        query: z.string().describe('Подстрока для поиска (регистронезависимо)'),
        type: z.string().optional().describe('Фильтр по типу ноды (точное совпадение)'),
        sheet_id: z.string().optional().describe('ID листа (по умолчанию все листы)'),
      },
    },
    async ({ project_id, query, type, sheet_id }) =>
      textResult(await findNodesInDb(project_id, query, { type, sheetId: sheet_id })),
  );

  server.registerTool(
    'db_list_connections',
    {
      description: 'Граф связей проекта из БД живого приложения: рёбра from→to с типом (auto/button/branch/parallel/input/keyboard) и флагом broken. Read-only. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
      },
    },
    async ({ project_id }) => textResult(await listConnectionsInDb(project_id)),
  );

  server.registerTool(
    'db_get_node',
    {
      description: 'Прочитать одну ноду целиком из БД живого приложения по id. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        node_id: z.string().describe('ID искомой ноды'),
        sheet_id: z.string().optional().describe('ID листа (по умолчанию поиск по всем листам)'),
      },
    },
    async ({ project_id, node_id, sheet_id }) =>
      textResult(await getNodeFromDb(project_id, node_id, sheet_id)),
  );

  server.registerTool(
    'db_add_sheet',
    {
      description: 'Добавить лист в проект в БД живого приложения (live). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        name: z.string().optional().describe('Имя листа (опционально; иначе "Лист N")'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, name, commit_message }) =>
      textResult(await addSheetInDb(project_id, name, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_duplicate_sheet',
    {
      description: 'Дублировать лист со всеми нодами в БД живого приложения с обновлением холста (live). Копия получает суффикс «(копия)», новые id нод/веток, внутренние связи ремаппятся на копии, лист становится активным. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        sheet_id: z.string().describe('ID дублируемого листа'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, sheet_id, commit_message }) =>
      textResult(await duplicateSheetInDb(project_id, sheet_id, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_rename_sheet',
    {
      description: 'Переименовать лист в проекте в БД живого приложения (live). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        sheet_id: z.string().describe('ID переименовываемого листа'),
        name: z.string().describe('Новое имя листа'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, sheet_id, name, commit_message }) =>
      textResult(await renameSheetInDb(project_id, sheet_id, name, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_remove_sheet',
    {
      description: 'Удалить лист из проекта в БД живого приложения (live). Нельзя удалить последний лист. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        sheet_id: z.string().describe('ID удаляемого листа'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, sheet_id, commit_message }) =>
      textResult(await removeSheetInDb(project_id, sheet_id, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_set_active_sheet',
    {
      description: 'Сделать лист активным в проекте в БД живого приложения (live). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        sheet_id: z.string().describe('ID листа, который сделать активным'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, sheet_id, commit_message }) =>
      textResult(await setActiveSheetInDb(project_id, sheet_id, {
        commitMessage: commit_message,
      })),
  );

  server.registerTool(
    'db_list_sheets',
    {
      description: 'Лёгкий read-only список листов проекта из БД живого приложения: id, name, число нод',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
      },
    },
    async ({ project_id }) => textResult(await listSheetsInDb(project_id)),
  );

  server.registerTool(
    'db_reorder_sheets',
    {
      description: 'Изменить порядок листов проекта в БД живого приложения (live). sheetIds — полный список id листов в нужном порядке (перестановка всех существующих). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        sheet_ids: z.array(z.string()).describe('Полный список id листов в нужном порядке'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, sheet_ids, commit_message }) =>
      textResult(await reorderSheetsInDb(project_id, sheet_ids, { commitMessage: commit_message })),
  );

  server.registerTool(
    'db_move_sheet_to_project',
    {
      description: 'Перенести (move) или скопировать (copy) лист из одного проекта в другой в БД живого приложения с обновлением обоих холстов (live). Оригинальные id нод/веток и связи СОХРАНЯЮТСЯ как есть; id перегенерируется только при коллизии с целевым проектом. Кросс-листовые ссылки на ноды других листов источника обрываются. По умолчанию mode=copy (безопасно). В режиме move лист удаляется из источника (нельзя унести последний лист), а в оставшихся листах источника обрываются ссылки на унесённые ноды. Порядок записи безопасный: сначала целевой проект, затем источник. Адресация по числовым projectId из URL редактора',
      inputSchema: {
        source_project_id: z.number().describe('ID исходного проекта (откуда переносится лист)'),
        target_project_id: z.number().describe('ID целевого проекта (куда переносится лист)'),
        sheet_id: z.string().describe('ID переносимого листа в исходном проекте'),
        mode: z.enum(['move', 'copy']).optional().describe('move — перенос с удалением из источника; copy — копирование (по умолчанию copy)'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ source_project_id, target_project_id, sheet_id, mode, commit_message }) =>
      textResult(await moveSheetToProjectInDb(
        source_project_id,
        target_project_id,
        sheet_id,
        mode ?? 'copy',
        { commitMessage: commit_message },
      )),
  );

  server.registerTool(
    'db_list_versions',
    {
      description: 'Список версий проекта из БД живого приложения (история чекпоинтов и авто-снимков): id, label, автор, kind, дата. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
      },
    },
    async ({ project_id }) => textResult(await listVersionsInDb(project_id)),
  );

  server.registerTool(
    'db_restore_version',
    {
      description: 'Откатить проект к версии из истории в БД живого приложения с обновлением холста (live). Создаёт новый чекпоинт отката. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        version_id: z.number().describe('ID версии из db_list_versions'),
        commit_message: z.string().optional().describe('Заметка к версии-чекпоинту отката'),
        skip_validation: z.boolean().optional().describe('Пропустить валидацию (по умолчанию true для отката)'),
      },
    },
    async ({ project_id, version_id, commit_message, skip_validation }) =>
      textResult(await restoreVersionInDb(project_id, version_id, {
        commitMessage: commit_message,
        skipValidation: skip_validation,
      })),
  );

  server.registerTool(
    'db_delete_version',
    {
      description: 'Удалить одну версию проекта из истории в БД (НЕОБРАТИМО). Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        version_id: z.number().describe('ID версии из db_list_versions'),
      },
    },
    async ({ project_id, version_id }) => textResult(await deleteVersionInDb(project_id, version_id)),
  );

  server.registerTool(
    'db_prune_versions',
    {
      description: 'Массово удалить версии проекта из истории по фильтру (НЕОБРАТИМО). keep — сколько последних оставить; kind — только auto/manual; author_kind — только agent/user. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        keep: z.number().optional().describe('Сколько последних версий (по дате) сохранить'),
        kind: z.enum(['auto', 'manual']).optional().describe('Удалять только версии этого вида'),
        author_kind: z.enum(['agent', 'user']).optional().describe('Удалять только версии этого типа автора'),
      },
    },
    async ({ project_id, keep, kind, author_kind }) =>
      textResult(await pruneVersionsInDb(project_id, { keep, kind, authorKind: author_kind })),
  );

  server.registerTool(
    'db_apply_ops',
    {
      description: 'Применить несколько операций к проекту в БД живого приложения за одну транзакцию (один live-broadcast и одна версия). Прерывается на первой ошибке без записи. Операции: add_node/update_node/remove_node/connect_nodes/disconnect_nodes/move_node/duplicate_node/add_sheet/rename_sheet/remove_sheet/duplicate_sheet/set_active_sheet — тип задаётся полем op. Адресация по числовому projectId из URL редактора',
      inputSchema: {
        project_id: z.number().describe('Числовой ID проекта из URL редактора'),
        ops: z.array(z.record(z.unknown())).describe('Массив операций; в каждой поле op задаёт тип (add_node, update_node, remove_node, connect_nodes, move_node, add_sheet, rename_sheet, remove_sheet, set_active_sheet)'),
        commit_message: z.string().optional().describe('Заметка к версии (ручной чекпоинт)'),
      },
    },
    async ({ project_id, ops, commit_message }) =>
      textResult(await applyOpsInDb(project_id, ops as never, { commitMessage: commit_message })),
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
