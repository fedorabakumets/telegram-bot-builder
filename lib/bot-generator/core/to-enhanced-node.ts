/**
 * @fileoverview Утилита для конвертации Node из схемы в EnhancedNode
 *
 * Модуль предоставляет функции для безопасного преобразования узлов
 * из @shared/schema в тип EnhancedNode с полной совместимостью.
 *
 * @module bot-generator/core/to-enhanced-node
 */

import type { Node, Button } from '@shared/schema';
import type { EnhancedNode } from '../types/enhanced-node.types';

/**
 * Нормализует кнопки узла для совместимости
 */
function normalizeButtons(buttons: any[]): Button[] {
  if (!buttons || !Array.isArray(buttons)) {
    return [];
  }

  return buttons.map((btn) => ({
    id: btn.id || `btn_${Date.now()}`,
    text: btn.text || 'Button',
    action: btn.action || 'goto',
    target: btn.target,
    url: btn.url,
    skipDataCollection: btn.skipDataCollection ?? false,
    hideAfterClick: btn.hideAfterClick ?? false,
    requestContact: btn.requestContact ?? false,
    requestLocation: btn.requestLocation ?? false,
  }));
}

/**
 * Конвертирует Node из схемы в EnhancedNode
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
 */
export function toEnhancedNodes(nodes: Node[]): EnhancedNode[] {
  if (!nodes || !Array.isArray(nodes)) {
    return [];
  }

  return nodes.map((node) => toEnhancedNode(node));
}
