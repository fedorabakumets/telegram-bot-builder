/**
 * @fileoverview Хук фильтрации узлов листа по поисковому запросу
 * @module components/editor/sidebar/hooks/use-sheet-node-search
 */

import { useMemo } from 'react';
import { getNodeTypeLabel } from '@/components/editor/properties/utils/node-formatters';

/**
 * Извлекает краткий текстовый контент узла для поиска
 * @param node - Узел проекта
 * @returns Строка с кратким содержимым узла
 */
function getShortContent(node: any): string {
  if (node.type === 'command_trigger') return node.data?.command || '';
  if (node.type === 'text_trigger') return node.data?.textSynonyms?.[0] || '';
  if (node.type === 'message') return node.data?.messageText || '';
  if (node.type === 'input') return node.data?.inputVariable || '';
  return '';
}

/**
 * Хук фильтрации узлов листа по поисковому запросу
 * Фильтрует по названию типа, краткому контенту и текстам кнопок клавиатуры
 * @param nodes - Массив узлов для фильтрации
 * @param query - Поисковый запрос
 * @returns Отфильтрованный массив узлов
 */
export function useSheetNodeSearch(nodes: any[], query: string): any[] {
  return useMemo(() => {
    if (!query.trim()) return nodes;

    const lower = query.toLowerCase();

    return nodes.filter((node) => {
      const typeLabel = getNodeTypeLabel(node.type).toLowerCase();
      if (typeLabel.includes(lower)) return true;

      const content = getShortContent(node).toLowerCase();
      if (content.includes(lower)) return true;

      const buttons: string[] = node.data?.buttons?.map((b: any) => b.text || '') ?? [];
      if (buttons.some((text) => text.toLowerCase().includes(lower))) return true;

      return false;
    });
  }, [nodes, query]);
}
