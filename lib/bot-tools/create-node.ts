/**
 * @fileoverview Создание корректной ноды с дефолтами
 * @module lib/bot-tools/create-node
 */

import { nanoid } from 'nanoid';
import type { Node } from '@shared/schema';
import { isMcpAllowedNodeType } from './mcp-allowed-types.ts';
import { getNodePresetData } from './node-presets.ts';
import { applyMessageDefaults } from './needs-message-defaults.ts';
import { minimizeNode } from './minimize-node-data.ts';
import { validateNode } from './validate-project.ts';
import type { ValidateProjectResult } from './types.ts';

/** Опции create_node */
export interface CreateNodeOptions {
  /** Явный id ноды */
  id?: string;
  /** Позиция на холсте */
  position?: { x: number; y: number };
  /** Перегенерировать id кнопок */
  regenerateButtonIds?: boolean;
}

let buttonCounter = 0;

/**
 * Генерирует уникальный id кнопки (без localStorage)
 * @returns id вида btn_N
 */
function nextButtonId(): string {
  buttonCounter += 1;
  return `btn_${buttonCounter}`;
}

/**
 * Регенерирует id у всех кнопок в data
 * @param data - data ноды
 */
function regenerateButtons(data: Record<string, unknown>): void {
  const buttons = data.buttons;
  if (!Array.isArray(buttons)) return;
  data.buttons = buttons.map((btn) => {
    if (!btn || typeof btn !== 'object') return btn;
    return { ...btn as Record<string, unknown>, id: nextButtonId() };
  });
}

/**
 * Создаёт валидную ноду с дефолтами конструктора
 * @param type - Тип ноды
 * @param partialData - Частичные data для merge поверх пресета
 * @param options - id, position, кнопки
 * @returns Нода и результат валидации
 */
export function createNode(
  type: string,
  partialData?: Record<string, unknown>,
  options: CreateNodeOptions = {},
): { node: Node; validation: ValidateProjectResult } {
  if (!isMcpAllowedNodeType(type)) {
    return {
      node: { id: '', type: 'message', position: { x: 0, y: 0 }, data: {} },
      validation: {
        valid: false,
        issues: [{
          severity: 'error',
          path: 'type',
          message: `Тип "${type}" недоступен в MCP. Используй list_node_types — только палитра конструктора.`,
          code: 'mcp_forbidden_node_type',
        }],
      },
    };
  }

  const nodeType = type as Node['type'];
  const preset = getNodePresetData(nodeType);
  let data = applyMessageDefaults(type, structuredClone(preset));
  if (partialData) {
    data = { ...data, ...structuredClone(partialData) };
  }
  if (options.regenerateButtonIds !== false) {
    regenerateButtons(data);
  }

  const node = minimizeNode({
    id: options.id ?? nanoid(),
    type: nodeType,
    position: options.position ?? { x: 200, y: 200 },
    data: data as Node['data'],
  });

  const validation = validateNode(type, node);
  return { node, validation };
}
