/**
 * @fileoverview Константы цветов для различных типов узлов
 * Реэкспорт из единого реестра node-registry
 */

import { nodeRegistry } from '../../shared/node-registry';

/**
 * Цвета для различных типов узлов на канвасе
 * Генерируются из единого реестра метаданных
 */
export const nodeColors: Record<string, string> = Object.fromEntries(
  Object.entries(nodeRegistry).map(([type, meta]) => [type, meta.canvasColor])
);
