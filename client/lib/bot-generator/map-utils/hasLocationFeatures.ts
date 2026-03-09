/**
 * @fileoverview Проверка наличия геолокационных элементов в боте
 * 
 * Модуль предоставляет функцию для анализа узлов бота
 * на наличие элементов геолокации.
 * 
 * @module bot-generator/map-utils/hasLocationFeatures
 */

import type { BotNode } from "../types";

/**
 * Проверяет наличие геолокационных элементов в боте
 * 
 * @param nodes - Массив узлов бота
 * @returns true если есть элементы геолокации
 * 
 * @example
 * const hasLocation = hasLocationFeatures(nodes);
 */
export function hasLocationFeatures(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  const hasLocationNode = nodes.some(node => node.type === 'location');

  const hasLocationButton = nodes.some(node => {
    const buttons = node.data.buttons;
    if (!buttons || !Array.isArray(buttons)) return false;
    return buttons.some((button) => 
      'action' in button && 
      button.action === 'location' && 
      'requestLocation' in button && 
      button.requestLocation
    );
  });

  return hasLocationNode || hasLocationButton;
}
