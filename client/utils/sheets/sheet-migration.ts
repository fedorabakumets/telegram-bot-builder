/**
 * @fileoverview Утилиты для миграции данных бота из старого формата в новый формат с листами.
 * @module client/utils/sheets/sheet-migration
 */

import { nanoid } from 'nanoid';
import { CanvasSheet, BotDataWithSheets, BotData } from '@shared/schema';
import { defaultNodeData } from './default-node-data';

/**
 * Мигрирует старые данные бота к новому формату с листами.
 * Если в старых данных нет узлов, создаётся стартовый узел по умолчанию.
 *
 * @param legacyData - Данные бота в старом формате без листов
 * @returns Данные бота в новом формате с одним листом, содержащим все узлы
 */
export function migrateLegacyData(legacyData: BotData): BotDataWithSheets {
  const hasNodes = legacyData.nodes && legacyData.nodes.length > 0;
  const nodes = hasNodes ? legacyData.nodes : [{
    id: 'start',
    type: 'start' as const,
    position: { x: 100, y: 100 },
    data: { ...defaultNodeData }
  }];

  const defaultSheet: CanvasSheet = {
    id: nanoid(),
    name: 'Лист 1',
    nodes: nodes,
    connections: [],
    viewState: {
      pan: { x: 0, y: 0 },
      zoom: 100
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const migratedData = {
    sheets: [defaultSheet],
    activeSheetId: defaultSheet.id,
    version: 2
  };

  console.log('🔄 Мигрированы данные:', {
    hasOriginalNodes: hasNodes,
    originalNodesCount: legacyData.nodes?.length || 0,
    migratedNodesCount: nodes.length,
    sheetsCount: migratedData.sheets.length,
    activeSheetId: migratedData.activeSheetId
  });

  return migratedData;
}

/**
 * Проверяет, являются ли данные новым форматом с листами.
 * Проверяет версию (должна быть 2) и наличие массива листов.
 *
 * @param data - Произвольные данные для проверки формата
 * @returns `true`, если данные соответствуют новому формату `BotDataWithSheets`, иначе `false`
 */
export function isNewFormat(data: any): data is BotDataWithSheets {
  return data && data.version === 2 && Array.isArray(data.sheets);
}
