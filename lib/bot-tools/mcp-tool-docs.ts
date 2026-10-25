/**
 * @fileoverview Каталог документации MCP-инструментов и рабочих процессов
 * @module lib/bot-tools/mcp-tool-docs
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Абсолютный каталог Markdown-карточек относительно этого модуля. */
const MCP_DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'generated', 'mcp-docs');
const TOOL_DOCS_DIR = join(MCP_DOCS_DIR, 'tools');
/** Каталог подробных руководств по нодам. */
const NODE_DOCS_DIR = join(MCP_DOCS_DIR, 'nodes');
/** Каталог правил MCP-документации. */
const RULE_DOCS_DIR = join(MCP_DOCS_DIR, 'rules');
/** Каталог workflow-документации. */
const WORKFLOW_DOCS_DIR = join(MCP_DOCS_DIR, 'workflows');
/** Автоматически разделённые reference-разделы старого промта. */
const REFERENCE_DOCS_DIR = join(MCP_DOCS_DIR, 'reference');

/** Карточка документации MCP-инструмента. */
interface ToolDoc {
  /** Название инструмента. */
  name: string;
  /** Назначение инструмента. */
  purpose: string;
  /** Когда инструмент следует вызывать. */
  when: string;
  /** Ограничения и типичные ошибки. */
  cautions: string[];
  /** Связанные инструменты. */
  related: string[];
}

/** Карточки наиболее важных инструментов для построения сценариев. */
const TOOL_DOCS: ToolDoc[] = [
  {
    name: 'list_node_types',
    purpose: 'Возвращает доступные типы нод и краткие описания.',
    when: 'Вызывай перед созданием ноды, если тип не подтверждён схемой.',
    cautions: ['Не придумывай типы нод по аналогии с Telegram API.'],
    related: ['get_node_schema', 'get_node_example'],
  },
  {
    name: 'get_node_schema',
    purpose: 'Возвращает валидную схему data и правила конкретного типа ноды.',
    when: 'Вызывай перед каждым созданием или существенным изменением ноды.',
    cautions: ['Поля, которых нет в схеме, нельзя добавлять по догадке.'],
    related: ['get_node_example', 'validate_node'],
  },
  {
    name: 'get_node_example',
    purpose: 'Возвращает рабочий пример ноды, включая форму data.',
    when: 'Используй как шаблон для нового узла и копируй его каноничный формат.',
    cautions: ['Проверь уникальность id и реальные цели переходов.'],
    related: ['get_node_schema', 'validate_bot_project'],
  },
  {
    name: 'validate_bot_project',
    purpose: 'Проверяет структуру проекта, связи, типы и обязательные поля.',
    when: 'Вызывай после каждой группы изменений и до записи в live-БД.',
    cautions: ['Предупреждение тоже нужно разобрать; отсутствие исключения не означает корректность.'],
    related: ['generate_bot_code', 'get_project_db'],
  },
  {
    name: 'generate_bot_code',
    purpose: 'Генерирует Python-код бота из проверенного проекта.',
    when: 'Вызывай после валидатора перед запуском или публикацией.',
    cautions: ['Не тестируй live-бота по одному только успешному JSON.'],
    related: ['validate_bot_project', 'db_bot_logs'],
  },
  {
    name: 'db_report_button_navigation',
    purpose: 'Показывает кнопки, их действия и цели переходов в live-проекте.',
    when: 'Вызывай при диагностике кнопочной навигации и после её изменения.',
    cautions: ['Проверь отсутствующие цели и дублирующие переходы.'],
    related: ['db_find_inbound', 'db_rewrite_button_navigation'],
  },
  {
    name: 'db_find_inbound',
    purpose: 'Находит входящие связи в указанную ноду.',
    when: 'Используй перед удалением, перенаправлением или расследованием повторного входа.',
    cautions: ['Не удаляй узел, пока не разобраны все входящие связи.'],
    related: ['db_report_button_navigation', 'db_apply_ops'],
  },
  {
    name: 'db_rewrite_button_navigation',
    purpose: 'Точечно исправляет навигацию кнопок в live-проекте.',
    when: 'Вызывай после отчёта навигации и только для подтверждённой цели.',
    cautions: ['Операция изменяет live-БД; перепроверь проект и валидатор после записи.'],
    related: ['db_report_button_navigation', 'validate_bot_project'],
  },
];

/** Рабочие процессы, которые агент может запросить по описанию задачи. */
const WORKFLOWS = [
  {
    id: 'calculator',
    keywords: ['калькулятор', 'calculator', 'два числа'],
    steps: ['get_node_docs(input)', 'get_node_docs(code)', 'get_rule_docs(variables)', 'get_workflow_docs(calculator)', 'validate_bot_project'],
  },
  {
    id: 'button-navigation',
    keywords: ['кнопк', 'навигац', 'переход'],
    steps: ['db_report_button_navigation', 'db_find_inbound', 'db_rewrite_button_navigation', 'validate_bot_project', 'generate_bot_code'],
  },
  {
    id: 'new-node',
    keywords: ['новую ноду', 'создать ноду', 'добавить узел'],
    steps: ['list_node_types', 'get_node_schema', 'get_node_example', 'validate_node', 'validate_bot_project', 'generate_bot_code'],
  },
  {
    id: 'live-change',
    keywords: ['live', 'живой проект', 'изменить проект'],
    steps: ['get_project_db', 'db_apply_ops', 'get_project_db', 'validate_bot_project', 'generate_bot_code', 'db_bot_status', 'db_bot_logs'],
  },
];

/** Создаёт единый текстовый ответ MCP. */
function result(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

/** Регистрирует read-only инструменты справки для MCP-агента. */
export function registerToolDocsTools(server: McpServer): void {
  server.registerTool('get_tool_docs', {
    description: 'Карточка MCP-инструмента: назначение, момент вызова, ограничения и связанные тулы',
    inputSchema: { tool_name: z.string().describe('Имя MCP-инструмента') },
  }, async ({ tool_name }) => {
    const doc = TOOL_DOCS.find((item) => item.name === tool_name);
    try {
      const content = await readFile(join(TOOL_DOCS_DIR, `${tool_name}.md`), 'utf8');
      return result({ tool_name, content });
    } catch {
      return result(doc ?? { error: 'Карточка не найдена', tool_name, checked: [TOOL_DOCS_DIR, join(process.cwd(), 'docs', 'mcp', 'tools')], next: ['get_prompt_guide', 'get_node_schema', 'get_node_example'] });
    }
  });

  server.registerTool('search_tool_docs', {
    description: 'Ищет карточки MCP-инструментов по имени, назначению и ограничениям',
    inputSchema: { query: z.string().min(1).describe('Поисковый запрос') },
  }, async ({ query }) => {
    const normalized = query.toLowerCase();
    const files = await readdir(TOOL_DOCS_DIR).catch(() => []);
    const matches = files.filter((file) => file.endsWith('.md') && file.toLowerCase().includes(normalized)).map((file) => file.replace(/\.md$/, ''));
    const embeddedMatches = TOOL_DOCS.filter((doc) => JSON.stringify(doc).toLowerCase().includes(normalized)).map((doc) => doc.name);
    return result({ query, matches: [...new Set([...matches, ...embeddedMatches])] });
  });

  server.registerTool('get_workflow_docs', {
    description: 'Возвращает рекомендуемую последовательность MCP-инструментов для задачи',
    inputSchema: { task: z.string().min(1).describe('Описание задачи обычным языком') },
  }, async ({ task }) => {
    const normalized = task.toLowerCase();
    const workflowFiles = await readdir(WORKFLOW_DOCS_DIR).catch(() => []);
    const directWorkflow = workflowFiles.find((file) => file.endsWith('.md') && normalized.includes(file.replace('.md', '').replaceAll('-', ' ')));
    if (directWorkflow) return result({ workflow: directWorkflow.replace('.md', ''), content: await readFile(join(WORKFLOW_DOCS_DIR, directWorkflow), 'utf8') });
    const workflow = WORKFLOWS.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
    return result(workflow ?? { error: 'Готовый workflow не найден', next: 'Сначала вызови search_tool_docs, затем get_prompt_guide' });
  });

  server.registerTool('get_node_docs', {
    description: 'Возвращает подробное руководство по поведению ноды для человека и ИИ-агента',
    inputSchema: { node_type: z.string().min(1).describe('Тип ноды, например input или code') },
  }, async ({ node_type }) => {
    try {
      return result({ node_type, content: await readFile(join(NODE_DOCS_DIR, `${node_type}.md`), 'utf8') });
    } catch {
      return result({ error: 'Документация ноды не найдена', node_type, next: ['get_node_schema', 'get_node_example'] });
    }
  });

  server.registerTool('get_rule_docs', {
    description: 'Возвращает тематические правила Bot Builder',
    inputSchema: { rule_name: z.string().min(1).describe('Имя правила, например variables') },
  }, async ({ rule_name }) => {
    try {
      return result({ rule_name, content: await readFile(join(RULE_DOCS_DIR, `${rule_name}.md`), 'utf8') });
    } catch {
      return result({ error: 'Правило не найдено', rule_name });
    }
  });

  server.registerTool('search_docs', {
    description: 'Ищет по карточкам MCP, руководствам нод, правилам и workflow',
    inputSchema: { query: z.string().min(1).describe('Поисковый запрос') },
  }, async ({ query }) => {
    const normalized = query.toLowerCase();
    const roots = [TOOL_DOCS_DIR, NODE_DOCS_DIR, RULE_DOCS_DIR, WORKFLOW_DOCS_DIR, REFERENCE_DOCS_DIR];
    const matches: string[] = [];
    for (const root of roots) {
      for (const file of await readdir(root).catch(() => [])) {
        if (!file.endsWith('.md')) continue;
        const content = await readFile(join(root, file), 'utf8').catch(() => '');
        if (content.toLowerCase().includes(normalized)) matches.push(join(root, file));
      }
    }
    return result({ query, matches });
  });
}
