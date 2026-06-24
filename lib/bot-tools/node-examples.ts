/**
 * @fileoverview Эталонные примеры нод для get_node_example
 * @module lib/bot-tools/node-examples
 */

import type { Node } from '@shared/schema';
import { isMcpAllowedNodeType } from './mcp-allowed-types.ts';
import { getNodePresetData } from './node-presets.ts';
import { minimizeNodeData } from './minimize-node-data.ts';

/** Шаблон позиции ноды на холсте */
const DEFAULT_POSITION = { x: 0, y: 0 };

/**
 * Собирает пример ноды из пресета data
 * @param type - Тип ноды
 * @param id - ID примера
 * @returns Пример ноды или null
 */
export function getNodeExample(type: string, id = 'example-node'): Record<string, unknown> | null {
  if (!isMcpAllowedNodeType(type)) return null;
  return {
    id,
    type,
    position: DEFAULT_POSITION,
    data: minimizeNodeData(type, getNodePresetData(type as Node['type'])),
  };
}
