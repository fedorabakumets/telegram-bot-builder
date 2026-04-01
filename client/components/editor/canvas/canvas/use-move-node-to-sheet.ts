/**
 * @fileoverview Хук перемещения узла между листами проекта
 */

import { useCallback } from 'react';
import { BotDataWithSheets } from '@shared/schema';

/**
 * Хук для перемещения узла из активного листа в другой лист
 *
 * @param botData - Данные бота с листами
 * @param onBotDataUpdate - Колбэк обновления данных бота
 * @returns Объект с функцией moveNodeToSheet
 */
export function useMoveNodeToSheet(
  botData: BotDataWithSheets | undefined,
  onBotDataUpdate: ((data: BotDataWithSheets) => void) | undefined
) {
  /**
   * Перемещает узел из активного листа в целевой лист
   *
   * @param nodeId - Идентификатор узла для перемещения
   * @param targetSheetId - Идентификатор целевого листа
   */
  const moveNodeToSheet = useCallback((nodeId: string, targetSheetId: string) => {
    if (!botData || !onBotDataUpdate) return;

    const activeSheetId = botData.activeSheetId;
    if (!activeSheetId || activeSheetId === targetSheetId) return;

    const activeSheet = botData.sheets.find(s => s.id === activeSheetId);
    if (!activeSheet) return;

    const nodeToMove = activeSheet.nodes.find(n => n.id === nodeId);
    if (!nodeToMove) return;

    const updatedSheets = botData.sheets.map(sheet => {
      if (sheet.id === activeSheetId) {
        return { ...sheet, nodes: sheet.nodes.filter(n => n.id !== nodeId) };
      }
      if (sheet.id === targetSheetId) {
        return { ...sheet, nodes: [...sheet.nodes, nodeToMove] };
      }
      return sheet;
    });

    onBotDataUpdate({ ...botData, sheets: updatedSheets });
  }, [botData, onBotDataUpdate]);

  return { moveNodeToSheet };
}
