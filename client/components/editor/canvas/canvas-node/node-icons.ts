/**
 * @fileoverview Константы иконок для различных типов узлов
 * Реэкспорт из единого реестра node-registry
 */

import { nodeRegistry } from '../../shared/node-registry';

/**
 * Иконки для различных типов узлов
 * Генерируются из единого реестра метаданных
 */
export const nodeIcons: Record<string, string> = Object.fromEntries(
  Object.entries(nodeRegistry).map(([type, meta]) => [type, meta.icon])
);
