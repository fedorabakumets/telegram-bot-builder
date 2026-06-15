/**
 * @fileoverview Хук группового перемещения узлов между листами проекта
 * @module canvas/use-move-nodes-to-sheet
 */

import { useCallback } from 'react';
import { BotDataWithSheets } from '@shared/schema';
import { createSheet } from '@/utils/sheets/sheet-crud';
import { clearExternalNodeReferences } from '@/utils/sheets/clear-external-references';

/**
 * Хук для перемещения группы узлов из активного листа в другой лист.
 *
 * Связи МЕЖДУ перемещаемыми узлами сохраняются. Связи, пересекающие границу
 * группы, теперь ОБРЫВАЮТСЯ: у перемещаемых узлов очищаются ссылки на узлы,
 * оставшиеся на исходном листе, а у оставшихся узлов очищаются ссылки на
 * перемещённые узлы. Это исключает появление «висячих» ссылок.
 *
 * @param botData - Данные бота с листами
 * @param onBotDataUpdate - Колбэк обновления данных бота
 * @returns Объект с функциями moveNodesToSheet и moveNodesToNewSheet
 */
export function useMoveNodesToSheet(
  botData: BotDataWithSheets | undefined,
  onBotDataUpdate: ((data: BotDataWithSheets) => void) | undefined
) {
  /**
   * Извлекает перемещаемые узлы из активного листа.
   *
   * @param nodeIds - Идентификаторы узлов для перемещения
   * @returns Активный лист и список найденных узлов или null
   */
  const extractNodes = useCallback((nodeIds: string[]) => {
    if (!botData || !onBotDataUpdate) return null;
    const activeSheetId = botData.activeSheetId;
    if (!activeSheetId) return null;
    const activeSheet = botData.sheets.find(s => s.id === activeSheetId);
    if (!activeSheet) return null;
    const idSet = new Set(nodeIds);
    const movingNodes = activeSheet.nodes.filter(n => idSet.has(n.id));
    if (movingNodes.length === 0) return null;
    // Идентификаторы узлов, остающихся на исходном листе после перемещения
    const remainingIds = new Set(
      activeSheet.nodes.filter(n => !idSet.has(n.id)).map(n => n.id)
    );
    return { activeSheetId, movingNodes, idSet, remainingIds };
  }, [botData, onBotDataUpdate]);

  /**
   * Перемещает группу узлов в существующий целевой лист.
   *
   * @param nodeIds - Идентификаторы узлов для перемещения
   * @param targetSheetId - Идентификатор целевого листа
   */
  const moveNodesToSheet = useCallback((nodeIds: string[], targetSheetId: string) => {
    const extracted = extractNodes(nodeIds);
    if (!extracted || !botData || !onBotDataUpdate) return;
    const { activeSheetId, movingNodes, idSet, remainingIds } = extracted;
    if (activeSheetId === targetSheetId) return;

    // У перемещаемых узлов обрываем ссылки на оставшиеся узлы (вне группы)
    const cleanedMovingNodes = movingNodes.map(n => ({
      ...n,
      data: clearExternalNodeReferences(n.data, idSet)
    }));

    const updatedSheets = botData.sheets.map(sheet => {
      if (sheet.id === activeSheetId) {
        // У оставшихся узлов обрываем ссылки на перемещённые узлы
        const remainingNodes = sheet.nodes
          .filter(n => !idSet.has(n.id))
          .map(n => ({ ...n, data: clearExternalNodeReferences(n.data, remainingIds) }));
        return { ...sheet, nodes: remainingNodes };
      }
      if (sheet.id === targetSheetId) {
        return { ...sheet, nodes: [...sheet.nodes, ...cleanedMovingNodes] };
      }
      return sheet;
    });

    onBotDataUpdate({ ...botData, sheets: updatedSheets });
  }, [botData, onBotDataUpdate, extractNodes]);

  /**
   * Создаёт новый лист с перемещаемыми узлами и удаляет их с активного листа.
   *
   * @param nodeIds - Идентификаторы узлов для перемещения
   * @param name - Название нового листа
   */
  const moveNodesToNewSheet = useCallback((nodeIds: string[], name: string) => {
    const extracted = extractNodes(nodeIds);
    if (!extracted || !botData || !onBotDataUpdate) return;
    const { activeSheetId, movingNodes, idSet, remainingIds } = extracted;

    // У перемещаемых узлов обрываем ссылки на оставшиеся узлы (вне группы)
    const cleanedMovingNodes = movingNodes.map(n => ({
      ...n,
      data: clearExternalNodeReferences(n.data, idSet)
    }));

    const newSheet = createSheet(name, cleanedMovingNodes);
    const updatedSheets = botData.sheets.map(sheet => {
      if (sheet.id === activeSheetId) {
        // У оставшихся узлов обрываем ссылки на перемещённые узлы
        const remainingNodes = sheet.nodes
          .filter(n => !idSet.has(n.id))
          .map(n => ({ ...n, data: clearExternalNodeReferences(n.data, remainingIds) }));
        return { ...sheet, nodes: remainingNodes };
      }
      return sheet;
    });

    onBotDataUpdate({ ...botData, sheets: [...updatedSheets, newSheet] });
  }, [botData, onBotDataUpdate, extractNodes]);

  return { moveNodesToSheet, moveNodesToNewSheet };
}
