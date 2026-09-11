/**
 * @fileoverview Отказ создания блоков выключенных типов в помощнике
 * @module lib/bot-tools/mcp-disabled-types
 */

import { formatDisabledNodeTypeMessage } from '../../shared/disabled-node-types.ts';

/**
 * Возвращает ошибку, если тип выключен администратором
 * @param type - Внутреннее имя типа
 * @param disabled - Множество выключенных типов
 * @returns Объект с error или null
 */
export function refuseDisabledNodeType(
  type: string,
  disabled: ReadonlySet<string>,
): { error: string } | null {
  if (!type || !disabled.has(type)) return null;
  return { error: formatDisabledNodeTypeMessage(type) };
}

/**
 * Извлекает type из объекта ноды
 * @param node - Объект ноды
 * @returns Имя типа или null
 */
export function extractNodeType(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null;
  const type = (node as Record<string, unknown>).type;
  return typeof type === 'string' ? type : null;
}

/**
 * Проверяет пакет операций на создание выключенных типов
 * @param ops - Массив операций
 * @param disabled - Множество выключенных типов
 * @returns Ошибка или null
 */
export function refuseDisabledAddOps(
  ops: unknown[],
  disabled: ReadonlySet<string>,
): { error: string } | null {
  if (!disabled.size) return null;
  for (const op of ops) {
    if (!op || typeof op !== 'object') continue;
    const record = op as Record<string, unknown>;
    if (record.op !== 'add_node') continue;
    const type = extractNodeType(record.node);
    if (!type) continue;
    const refused = refuseDisabledNodeType(type, disabled);
    if (refused) return refused;
  }
  return null;
}
