/**
 * @fileoverview Introspection-инструменты: схемы, типы, операторы, промпт
 * @module lib/bot-tools/introspection
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { nodeSchema } from '@shared/schema';
import { STANDARD_COMMANDS } from '../commands.ts';
import { CONDITION_OPERATORS, ZOD_CONDITION_OPERATORS } from './constants.ts';
import { extractEnumFields } from './enum-introspection.ts';
import {
  buildMcpNodeTypeList,
  getMcpForbiddenTypesHint,
  isMcpAllowedNodeType,
  MCP_ALLOWED_NODE_TYPES,
} from './mcp-allowed-types.ts';
import { getNodeExample } from './node-examples.ts';

/** Мемоизированная карта enum-полей data ноды (вычисляется один раз) */
let cachedEnumFields: Record<string, string[]> | undefined;

/**
 * Возвращает карту допустимых значений всех enum-полей data ноды.
 * Разворачивает возможные обёртки над nodeSchema.shape.data до ZodObject и
 * рекурсивно собирает значения через extractEnumFields. Результат кешируется.
 * @returns Плоская карта "путь к полю → массив enum-значений"
 */
function getDataEnumFields(): Record<string, string[]> {
  if (cachedEnumFields) {
    return cachedEnumFields;
  }
  // data может быть обёрнут (optional/default) — extractEnumFields сам развернёт
  const dataSchema = (nodeSchema as any)?.shape?.data;
  cachedEnumFields = extractEnumFields(dataSchema);
  return cachedEnumFields;
}

/** Критические правила формата project.json для ИИ */
const PROJECT_FORMAT_RULES = [
  'Корневой объект: { version: 2, sheets: [...], activeSheetId?: string }',
  'НЕ использовать legacy { nodes: [] } без sheets при создании нового проекта',
  'condition-нода: поле branches (массив), НЕ conditions и НЕ defaultTarget',
  'Обязательна ветка condition с operator: "else"',
  'НЕ создавать start, command, photo, video — см. list_node_types forbidden',
  'Копировать формат data из get_node_example(type)',
];

/**
 * Возвращает список типов нод, доступных в MCP (палитра UI)
 * @returns Объект с types, count и forbidden
 */
export function listNodeTypes() {
  return {
    types: buildMcpNodeTypeList(),
    count: MCP_ALLOWED_NODE_TYPES.length,
    ...getMcpForbiddenTypesHint(),
  };
}

/**
 * Возвращает схему и правила для типа ноды
 * @param type - Тип ноды
 * @returns Описание формата ноды
 */
export function getNodeSchema(type: string) {
  if (!isMcpAllowedNodeType(type)) {
    return {
      error: `Тип "${type}" недоступен в MCP (legacy или вне палитры конструктора)`,
      availableTypes: [...MCP_ALLOWED_NODE_TYPES],
      ...getMcpForbiddenTypesHint(),
    };
  }

  const base = {
    id: 'string — уникальный ID ноды',
    type,
    position: { x: 'number', y: 'number' },
    data: 'object — поля зависят от типа, см. shared/schema/tables/node-schema.ts',
  };

  const typeNotes: Record<string, string[]> = {
    condition: [
      'data.variable — имя переменной для проверки',
      'data.branches — массив веток с id, label, operator, value, target?',
      'operator: только из list_operators',
      'Обязательна ветка с operator: "else"',
    ],
    command_trigger: ['data.command — текст команды, например "/start"'],
    message: ['data.messageText — текст сообщения', 'data.buttons — массив кнопок'],
  };

  return {
    type,
    nodeStructure: base,
    projectFormatRules: PROJECT_FORMAT_RULES,
    typeSpecificNotes: typeNotes[type] ?? [`Стандартные поля data: messageText, buttons, keyboardType, markdown и др.`],
    example: getNodeExample(type),
    enumFields: getDataEnumFields(),
    zodConditionOperators: type === 'condition' ? [...ZOD_CONDITION_OPERATORS] : undefined,
  };
}

/**
 * Возвращает белый список операторов condition-ноды
 * @returns Список операторов с пояснением
 */
export function listOperators() {
  return {
    operators: [...CONDITION_OPERATORS],
    zodAcceptedOperators: [...ZOD_CONDITION_OPERATORS],
    note: 'Используйте только операторы из operators. not_equals, starts_with и др. поддерживаются генератором, но часть может отсутствовать в zod — validate_bot_project предупредит.',
    forbidden: ['not_empty', 'is_empty', 'is_not_empty', 'conditions', 'defaultTarget'],
  };
}

/**
 * Возвращает стандартные команды Telegram
 * @returns Список команд
 */
export function listCommands() {
  return { commands: STANDARD_COMMANDS };
}

/**
 * Читает docs/bot-json-prompt.md
 * @param projectRoot - Корень репозитория (по умолчанию process.cwd())
 * @returns Текст промпта или ошибка
 */
export function getPromptGuide(projectRoot = process.cwd()) {
  const path = join(projectRoot, 'docs', 'bot-json-prompt.md');
  try {
    const content = readFileSync(path, 'utf-8');
    return { path, content, length: content.length };
  } catch {
    return { error: `Файл не найден: ${path}` };
  }
}

/**
 * Возвращает эталонный пример ноды
 * @param type - Тип ноды
 * @returns Пример или ошибка
 */
export function getNodeExampleTool(type: string) {
  if (!isMcpAllowedNodeType(type)) {
    return {
      error: `Тип "${type}" недоступен в MCP`,
      ...getMcpForbiddenTypesHint(),
    };
  }
  const example = getNodeExample(type);
  if (!example) {
    return { error: `Нет примера для типа "${type}"`, hint: 'Вызовите get_node_schema(type)' };
  }
  return { type, example };
}
