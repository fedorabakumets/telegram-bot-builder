/**
 * @fileoverview Хук группового перемещения узлов между листами проекта
 * @module canvas/use-move-nodes-to-sheet
 */

import { useCallback } from 'react';
import { BotDataWithSheets } from '@shared/schema';
import { createSheet } from '@/utils/sheets/sheet-crud';

/**
 * Хук для перемещения группы узлов из активного листа в другой лист.
 *
 * ОГРАНИЧЕНИЕ: связи между перемещаемыми узлами сохраняются (узлы переносятся
 * как есть со своими data). Связи к узлам ВНЕ группы на этом этапе не
 * обрываются и не переносятся — целевые id остаются в данных, но указывают
 * на узлы, оставшиеся на исходном листе.
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
    return { activeSheetId, movingNodes, idSet };
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
    const { activeSheetId, movingNodes, idSet } = extracted;
    if (activeSheetId === targetSheetId) return;

    const updatedSheets = botData.sheets.map(sheet => {
      if (sheet.id === activeSheetId) {
        return { ...sheet, nodes: sheet.nodes.filter(n => !idSet.has(n.id)) };
      }
      if (sheet.id === targetSheetId) {
        return { ...sheet, nodes: [...sheet.nodes, ...movingNodes] };
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
    const { activeSheetId, movingNodes, idSet } = extracted;

    const newSheet = createSheet(name, movingNodes);
    const updatedSheets = botData.sheets.map(sheet => {
      if (sheet.id === activeSheetId) {
        return { ...sheet, nodes: sheet.nodes.filter(n => !idSet.has(n.id)) };
      }
      return sheet;
    });

    onBotDataUpdate({ ...botData, sheets: [...updatedSheets, newSheet] });
  }, [botData, onBotDataUpdate, extractNodes]);

  return { moveNodesToSheet, moveNodesToNewSheet };
}
