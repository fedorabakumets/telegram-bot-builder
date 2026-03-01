/**
 * @fileoverview Утилита для конвертации Node из схемы в EnhancedNode
 * 
 * Модуль предоставляет функции для безопасного преобразования узлов
 * из @shared/schema в тип EnhancedNode с полной совместимостью.
 * 
 * @module bot-generator/utils/to-enhanced-node
 */

import type { Node } from '@shared/schema';
import type { EnhancedNode } from '../types/enhanced-node.types';
import type { ButtonOverride } from '../types/node-data-override.types';

/**
 * Нормализует кнопки узла для совместимости
 * 
 * @param buttons - Кнопки из схемы
 * @returns Нормализованные кнопки
 * 
 * @example
 * const normalized = normalizeButtons(node.data.buttons);
 */
function normalizeButtons(buttons: any[]): ButtonOverride[] {
  if (!buttons || !Array.isArray(buttons)) {
    return [];
  }

  return buttons.map((btn) => ({
    id: btn.id || `btn_${Date.now()}`,
    text: btn.text || 'Button',
    action: btn.action || 'default',
    target: btn.target,
    url: btn.url,
    buttonType: btn.buttonType || 'normal',
    skipDataCollection: btn.skipDataCollection ?? false,
    hideAfterClick: btn.hideAfterClick ?? false,
    requestContact: btn.requestContact ?? false,
    requestLocation: btn.requestLocation ?? false,
  }));
}

/**
 * Конвертирует Node из схемы в EnhancedNode
 * 
 * @param node - Узел из @shared/schema
 * @returns Безопасный EnhancedNode
 * 
 * @example
 * const enhanced = toEnhancedNode(node);
 */
export function toEnhancedNode(node: Node): EnhancedNode {
  return {
    ...node,
    data: {
      ...node.data,
      buttons: normalizeButtons(node.data.buttons as any[]) || [],
      attachedMedia: (node.data as any).attachedMedia ?? [],
    },
  } as EnhancedNode;
}

/**
 * Конвертирует массив узлов из схемы в EnhancedNode[]
 * 
 * @param nodes - Массив узлов из @shared/schema
 * @returns Массив EnhancedNode
 * 
 * @example
 * const enhanced = toEnhancedNodes(nodes);
 */
export function toEnhancedNodes(nodes: Node[]): EnhancedNode[] {
  if (!nodes || !Array.isArray(nodes)) {
    return [];
  }

  return nodes.map((node) => toEnhancedNode(node));
}
