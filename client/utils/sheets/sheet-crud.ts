/**
 * @fileoverview CRUD-операции над листами проекта: создание, дублирование, удаление, переименование.
 * @module client/utils/sheets/sheet-crud
 */

import { nanoid } from 'nanoid';
import { CanvasSheet, BotDataWithSheets, Node } from '@shared/schema';
import { generateNewId } from '@/components/editor/canvas/canvas/utils/extract-base-id';
import { defaultNodeData } from './default-node-data';
import { updateNodeReferencesInData } from './sheet-node-references';

/**
 * Создаёт новый лист с заданным именем и узлами.
 * Если узлы не переданы, создаётся стартовый узел по умолчанию.
 *
 * @param name - Название нового листа
 * @param nodes - Массив узлов для размещения на листе (по умолчанию пустой)
 * @returns Новый объект листа `CanvasSheet`
 */
export function createSheet(name: string, nodes: Node[] = []): CanvasSheet {
  const defaultNodes = nodes.length === 0 ? [{
    id: 'start',
    type: 'start' as const,
    position: { x: 100, y: 100 },
    data: { ...defaultNodeData }
  }] : nodes;

  return {
    id: nanoid(),
    name,
    nodes: defaultNodes,
    viewState: {
      pan: { x: 0, y: 0 },
      zoom: 100
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Создаёт копию листа с новыми ID для узлов и соединений.
 * Все ссылки на узлы внутри данных также обновляются.
 *
 * @param originalSheet - Исходный лист для дублирования
 * @returns Новый лист с уникальными ID и смещёнными позициями узлов
 */
export function duplicateSheet(originalSheet: CanvasSheet): CanvasSheet {
  const duplicatedNodes = originalSheet.nodes.map(node => ({
    ...node,
    id: generateNewId(node.id, 'dup'),
    position: {
      x: node.position.x + 50,
      y: node.position.y + 50
    }
  }));

  const nodeIdMap = new Map(
    originalSheet.nodes.map((node, index) => [node.id, duplicatedNodes[index].id])
  );

  const updatedNodesWithReferences = duplicatedNodes.map(node => ({
    ...node,
    data: updateNodeReferencesInData(node.data, nodeIdMap)
  }));

  return {
    id: nanoid(),
    name: `${originalSheet.name} (копия)`,
    nodes: updatedNodesWithReferences,
    viewState: { ...originalSheet.viewState },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Создаёт новый лист с заданным именем и добавляет его в проект.
 * Новый лист становится активным.
 *
 * @param data - Текущие данные проекта с листами
 * @param name - Название нового листа
 * @returns Обновлённые данные проекта с добавленным листом
 */
export function addSheet(data: BotDataWithSheets, name: string): BotDataWithSheets {
  const newSheet = createSheet(name);
  return {
    ...data,
    sheets: [...data.sheets, newSheet],
    activeSheetId: newSheet.id
  };
}

/**
 * Удаляет лист с заданным ID из проекта.
 * Если удаляемый лист был активным, выбирается ближайший лист.
 *
 * @param data - Текущие данные проекта с листами
 * @param sheetId - ID листа для удаления
 * @returns Обновлённые данные проекта без удалённого листа
 * @throws {Error} Если пытаемся удалить последний лист
 */
export function deleteSheet(data: BotDataWithSheets, sheetId: string): BotDataWithSheets {
  if (data.sheets.length <= 1) {
    throw new Error('Нельзя удалить последний лист');
  }

  const deleteSheetIndex = data.sheets.findIndex(sheet => sheet.id === sheetId);
  const filteredSheets = data.sheets.filter(sheet => sheet.id !== sheetId);

  let newActiveSheetId = data.activeSheetId;

  if (data.activeSheetId === sheetId) {
    if (deleteSheetIndex < data.sheets.length - 1) {
      newActiveSheetId = data.sheets[deleteSheetIndex + 1].id;
    } else {
      newActiveSheetId = data.sheets[deleteSheetIndex - 1].id;
    }
  }

  return {
    ...data,
    sheets: filteredSheets,
    activeSheetId: newActiveSheetId
  };
}

/**
 * Изменяет имя листа с заданным ID.
 *
 * @param data - Текущие данные проекта с листами
 * @param sheetId - ID листа для переименования
 * @param newName - Новое название листа
 * @returns Обновлённые данные проекта с переименованным листом
 */
export function renameSheet(data: BotDataWithSheets, sheetId: string, newName: string): BotDataWithSheets {
  return {
    ...data,
    sheets: data.sheets.map(sheet =>
      sheet.id === sheetId
        ? { ...sheet, name: newName, updatedAt: new Date() }
        : sheet
    )
  };
}

/**
 * Дублирует лист в проекте. Дубликат становится активным.
 *
 * @param data - Текущие данные проекта с листами
 * @param sheetId - ID листа для дублирования
 * @returns Обновлённые данные проекта с добавленным дубликатом листа
 * @throws {Error} Если лист с указанным ID не найден
 */
export function duplicateSheetInProject(data: BotDataWithSheets, sheetId: string): BotDataWithSheets {
  const originalSheet = data.sheets.find(sheet => sheet.id === sheetId);
  if (!originalSheet) {
    throw new Error('Лист не найден');
  }

  const duplicatedSheet = duplicateSheet(originalSheet);
  return {
    ...data,
    sheets: [...data.sheets, duplicatedSheet],
    activeSheetId: duplicatedSheet.id
  };
}
