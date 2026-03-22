/**
 * @fileoverview Миграция устаревших типов узлов (start/command → message)
 *
 * При загрузке листа узлы типа `start` и `command` преобразуются в `message`.
 * Триггерная часть (команда) уже обрабатывается отдельной миграцией
 * `migrateCommandsToCommandTriggers`, которая создаёт `command_trigger` узел.
 * Данная миграция завершает переход — меняет тип исходного узла на `message`.
 *
 * @module canvas/utils/migrate-legacy-node-types
 */

import { Node } from '@shared/schema';

/**
 * Преобразует узлы устаревших типов `start` и `command` в тип `message`.
 *
 * Сохраняет все данные узла без изменений — только меняет `type`.
 * Поля специфичные для триггера (`command`, `description`, `showInMenu`)
 * остаются в `data` — они игнорируются рендерером `message`.
 *
 * @param {Node[]} nodes - Массив узлов листа
 * @returns {Node[]} Новый массив с преобразованными узлами
 */
export function migrateLegacyNodeTypes(nodes: Node[]): Node[] {
  return nodes.map(node => {
    if (node.type !== 'start' && node.type !== 'command') return node;
    return { ...node, type: 'message' };
  });
}
