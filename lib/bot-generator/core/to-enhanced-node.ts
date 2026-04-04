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
 * Нормализует кнопки узла для совместимости.
 * Сохраняет все поля кнопки, включая customCallbackData.
 * @param buttons - Массив кнопок для нормализации
 * @returns Нормализованный массив кнопок
 */
function normalizeButtons(buttons: any[]): Button[] {
  if (!buttons || !Array.isArray(buttons)) {
    return [];
  }

  return buttons.map((btn) => ({
    id: btn.id || `btn_${Date.now()}`,
    text: btn.text || 'Button',
    action: btn.action || 'goto',
    buttonType: btn.buttonType ?? 'normal',
    target: btn.target,
    url: btn.url,
    skipDataCollection: btn.skipDataCollection ?? false,
    hideAfterClick: btn.hideAfterClick ?? false,
    requestContact: btn.requestContact ?? false,
    requestLocation: btn.requestLocation ?? false,
    /** Пользовательский callback_data (приоритет над target/id) */
    customCallbackData: btn.customCallbackData,
    /** Текст для копирования в буфер обмена (только для copy_text) */
    copyText: btn.copyText,
    /** URL для Telegram Mini App (только для web_app, требует HTTPS) */
    webAppUrl: btn.webAppUrl,
    /** Визуальный стиль кнопки (Bot API 9.4) */
    style: btn.style,
  }));
}

/**
 * Конвертирует Node из схемы в EnhancedNode
 * Если узел некорректен (нет id или data), возвращает null
 */
export function toEnhancedNode(node: Node): EnhancedNode | null {
  // Пропускаем узлы без id
  if (!node || !node.id) {
    return null;
  }

  // Пропускаем узлы без data
  if (!node.data) {
    return null;
  }

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
 * Фильтрует некорректные узлы (без id или data)
 */
export function toEnhancedNodes(nodes: Node[]): EnhancedNode[] {
  if (!nodes || !Array.isArray(nodes)) {
    return [];
  }

  return nodes
    .map((node) => toEnhancedNode(node))
    .filter((node): node is EnhancedNode => node !== null);
}
