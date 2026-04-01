/**
 * @fileoverview Хук управления выбором узлов для массового перемещения
 * @module components/editor/sidebar/hooks/use-node-selection
 */

import { useState, useCallback } from 'react';

/**
 * Результат хука управления выбором узлов
 */
export interface UseNodeSelectionResult {
  /** Множество идентификаторов выбранных узлов */
  selectedNodeIds: Set<string>;
  /** Переключить выбор узла */
  toggleNode: (nodeId: string) => void;
  /** Сбросить выбор всех узлов */
  clearSelection: () => void;
  /** Проверить, выбран ли узел */
  isSelected: (nodeId: string) => boolean;
  /** Количество выбранных узлов */
  selectedCount: number;
}

/**
 * Хук управления выбором узлов для массового перемещения
 * @returns Объект с состоянием выбора и методами управления
 */
export function useNodeSelection(): UseNodeSelectionResult {
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  /**
   * Переключает выбор узла по идентификатору
   * @param nodeId - Идентификатор узла
   */
  const toggleNode = useCallback((nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  /**
   * Сбрасывает выбор всех узлов
   */
  const clearSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
  }, []);

  /**
   * Проверяет, выбран ли узел
   * @param nodeId - Идентификатор узла
   * @returns true если узел выбран
   */
  const isSelected = useCallback(
    (nodeId: string) => selectedNodeIds.has(nodeId),
    [selectedNodeIds]
  );

  return {
    selectedNodeIds,
    toggleNode,
    clearSelection,
    isSelected,
    selectedCount: selectedNodeIds.size,
  };
}
