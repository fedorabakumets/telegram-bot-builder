/**
 * @fileoverview Хук синхронизации узлов с данными листов
 *
 * Синхронизирует массив nodes с активным листом в botDataWithSheets.
 * Необходим для корректной работы undo/redo.
 *
 * @module UseNodesSync
 */

import { useEffect } from 'react';
import type { Node, BotDataWithSheets } from '@shared/schema';

/** Параметры хука useNodesSync */
export interface UseNodesSyncParams {
  /** Текущие узлы холста */
  nodes: Node[];
  /** Данные бота с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Установить данные бота с листами */
  setBotDataWithSheets: (data: BotDataWithSheets) => void;
}

/**
 * Синхронизирует nodes → botDataWithSheets для корректной работы undo/redo.
 * Обновляет активный лист при изменении массива узлов.
 *
 * @param params - Параметры хука
 */
export function useNodesSync(params: UseNodesSyncParams): void {
  const { nodes, botDataWithSheets, setBotDataWithSheets } = params;

  useEffect(() => {
    if (!botDataWithSheets?.activeSheetId) return;

    const activeSheet = botDataWithSheets.sheets.find(
      sheet => sheet.id === botDataWithSheets.activeSheetId
    );

    if (!activeSheet || activeSheet.nodes === nodes) return;

    setBotDataWithSheets({
      ...botDataWithSheets,
      sheets: botDataWithSheets.sheets.map(sheet =>
        sheet.id === botDataWithSheets.activeSheetId
          ? { ...sheet, nodes }
          : sheet
      ),
    });
  }, [nodes, botDataWithSheets, setBotDataWithSheets]);
}
