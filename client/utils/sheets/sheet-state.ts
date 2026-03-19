/**
 * @fileoverview Утилиты для управления состоянием листов: активный лист, узлы, вид, валидация и конвертация.
 * @module client/utils/sheets/sheet-state
 */

import { CanvasSheet, BotDataWithSheets, BotData, Node } from '@shared/schema';

/**
 * Устанавливает активный лист по его ID.
 *
 * @param data - Текущие данные проекта с листами
 * @param sheetId - ID листа, который нужно сделать активным
 * @returns Обновлённые данные проекта с новым активным листом
 * @throws {Error} Если лист с указанным ID не найден
 */
export function setActiveSheet(data: BotDataWithSheets, sheetId: string): BotDataWithSheets {
  const sheetExists = data.sheets.some(sheet => sheet.id === sheetId);
  if (!sheetExists) {
    throw new Error('Лист не найден');
  }

  return {
    ...data,
    activeSheetId: sheetId
  };
}

/**
 * Обновляет массив узлов в указанном листе.
 *
 * @param data - Текущие данные проекта с листами
 * @param sheetId - ID листа для обновления
 * @param nodes - Новый массив узлов
 * @returns Обновлённые данные проекта с новыми узлами в листе
 */
export function updateSheetNodes(data: BotDataWithSheets, sheetId: string, nodes: Node[]): BotDataWithSheets {
  return {
    ...data,
    sheets: data.sheets.map(sheet =>
      sheet.id === sheetId
        ? { ...sheet, nodes, updatedAt: new Date() }
        : sheet
    )
  };
}

/**
 * Обновляет данные (узлы) в указанном листе.
 *
 * @param data - Текущие данные проекта с листами
 * @param sheetId - ID листа для обновления
 * @param nodes - Новый массив узлов
 * @returns Обновлённые данные проекта с новыми узлами в листе
 */
export function updateSheetData(data: BotDataWithSheets, sheetId: string, nodes: Node[]): BotDataWithSheets {
  return {
    ...data,
    sheets: data.sheets.map(sheet =>
      sheet.id === sheetId
        ? { ...sheet, nodes, updatedAt: new Date() }
        : sheet
    )
  };
}

/**
 * Обновляет состояние вида листа (зум и панорамирование).
 *
 * @param data - Текущие данные проекта с листами
 * @param sheetId - ID листа для обновления
 * @param viewState - Новое состояние вида с позицией панорамирования и уровнем зума
 * @returns Обновлённые данные проекта с новым состоянием вида листа
 */
export function updateSheetViewState(
  data: BotDataWithSheets,
  sheetId: string,
  viewState: { pan: { x: number; y: number }; zoom: number }
): BotDataWithSheets {
  return {
    ...data,
    sheets: data.sheets.map(sheet =>
      sheet.id === sheetId
        ? { ...sheet, viewState, updatedAt: new Date() }
        : sheet
    )
  };
}

/**
 * Возвращает активный лист или первый лист, если активный не задан.
 *
 * @param data - Данные проекта с листами
 * @returns Активный лист или `null`, если листов нет
 */
export function getActiveSheet(data: BotDataWithSheets): CanvasSheet | null {
  if (!data.activeSheetId) {
    return data.sheets[0] || null;
  }
  return data.sheets.find(sheet => sheet.id === data.activeSheetId) || null;
}

/**
 * Валидирует структуру данных проекта.
 * Проверяет наличие листов, активного листа и уникальность ID.
 *
 * @param data - Данные проекта для валидации
 * @returns Массив строк с описанием найденных ошибок (пустой, если ошибок нет)
 */
export function validateData(data: BotDataWithSheets): string[] {
  const errors: string[] = [];

  if (!Array.isArray(data.sheets)) {
    errors.push('Некорректная структура листов');
  }

  if (data.sheets.length === 0) {
    errors.push('Проект должен содержать хотя бы один лист');
  }

  const activeSheet = getActiveSheet(data);
  if (!activeSheet) {
    errors.push('Активный лист не найден');
  }

  const sheetIds = data.sheets.map(sheet => sheet.id);
  const uniqueIds = new Set(sheetIds);
  if (sheetIds.length !== uniqueIds.size) {
    errors.push('Обнаружены дублирующиеся ID листов');
  }

  return errors;
}

/**
 * Конвертирует данные проекта обратно в старый формат для обратной совместимости.
 * Использует узлы и соединения из активного листа.
 *
 * @param data - Данные проекта в новом формате с листами
 * @returns Данные бота в старом формате `BotData` без листов
 */
export function toLegacyFormat(data: BotDataWithSheets): BotData {
  const activeSheet = getActiveSheet(data);
  if (!activeSheet) {
    return { nodes: [], connections: [] };
  }

  return {
    nodes: activeSheet.nodes,
    connections: activeSheet.connections || []
  };
}
