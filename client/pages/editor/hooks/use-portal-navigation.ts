/**
 * @fileoverview Хук программной навигации к целевой ноде через портал
 *
 * Реализует переход на лист с фокусом на конкретной ноде по двойному
 * клику на портал. Использует паттерн "отложенного фокуса" (pendingNodeRef):
 * после переключения листа ноды обновляются асинхронно, поэтому фокус
 * откладывается до появления целевой ноды в массиве nodes.
 *
 * В отличие от use-editor-node-url — без синхронизации с URL, чисто
 * программная навигация.
 *
 * @module pages/editor/hooks/use-portal-navigation
 */

import { useCallback, useEffect, useRef } from 'react';
import type { BotDataWithSheets, Node } from '@shared/schema';
import { findSheetIdByNodeId } from '../utils/find-sheet-by-node-id';

/** Параметры хука usePortalNavigation */
export interface UsePortalNavigationParams {
  /** Данные проекта с листами (для поиска листа по ID ноды) */
  botDataWithSheets: BotDataWithSheets | null;
  /** Узлы активного листа на канвасе */
  nodes: Node[];
  /** Переключить активный лист */
  handleSheetSelect: (sheetId: string) => void;
  /** Сфокусироваться на узле (камера, подсветка) */
  handleNodeFocus: (nodeId: string, buttonId?: string) => void;
  /** Установить выбранный узел */
  setSelectedNodeId: (nodeId: string | null) => void;
}

/** Результат хука usePortalNavigation */
export interface UsePortalNavigationResult {
  /**
   * Перейти к целевой ноде: переключить лист (если нужно) и сфокусироваться
   * @param targetNodeId - ID целевой ноды (на любом листе проекта)
   */
  navigateToPortalNode: (targetNodeId: string) => void;
}

/**
 * Управляет программной навигацией к ноде через портал с отложенным фокусом
 * @param params - Параметры хука
 * @returns Обработчик навигации к целевой ноде
 */
export function usePortalNavigation(params: UsePortalNavigationParams): UsePortalNavigationResult {
  const {
    botDataWithSheets,
    nodes,
    handleSheetSelect,
    handleNodeFocus,
    setSelectedNodeId,
  } = params;

  /** Ожидающая фокуса нода после переключения листа */
  const pendingNodeRef = useRef<string | null>(null);

  const navigateToPortalNode = useCallback((targetNodeId: string) => {
    if (!botDataWithSheets || !targetNodeId) return;

    const sheetId = findSheetIdByNodeId(botDataWithSheets.sheets, targetNodeId);
    if (!sheetId) return;

    // Целевая нода на активном листе — фокусируемся сразу
    if (botDataWithSheets.activeSheetId === sheetId) {
      pendingNodeRef.current = null;
      setSelectedNodeId(targetNodeId);
      handleNodeFocus(targetNodeId);
      return;
    }

    // Другой лист — откладываем фокус до появления ноды в nodes
    pendingNodeRef.current = targetNodeId;
    handleSheetSelect(sheetId);
  }, [botDataWithSheets, handleSheetSelect, handleNodeFocus, setSelectedNodeId]);

  // Отложенный фокус: ждём появления целевой ноды на новом листе
  useEffect(() => {
    const pendingNodeId = pendingNodeRef.current;
    if (!pendingNodeId) return;
    if (!nodes.some(node => node.id === pendingNodeId)) return;

    pendingNodeRef.current = null;
    setSelectedNodeId(pendingNodeId);
    handleNodeFocus(pendingNodeId);
  }, [nodes, handleNodeFocus, setSelectedNodeId]);

  return { navigateToPortalNode };
}
