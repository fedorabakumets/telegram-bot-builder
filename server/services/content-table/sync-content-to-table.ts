/**
 * @fileoverview Синхронизация контента из JSON сценария в таблицу _content
 * @module services/content-table/sync-content-to-table
 */

import { storage } from "../../storages/storage";
import type { BotTableRow } from "@shared/schema";
import { ensureContentTable } from "./create-content-table";
import { extractContentFromNodes, type ContentEntry } from "./content-key-parser";

/** Максимальное количество записей контента на проект */
const MAX_ENTRIES = 1000;

/**
 * Строит маппинг имя колонки → ID колонки для таблицы
 * @param tableId - ID таблицы
 * @returns Объект { key: "162", type: "163", ... }
 */
async function getColumnIdMap(tableId: number): Promise<Record<string, string>> {
  const columns = await storage.getBotTableColumns(tableId);
  const map: Record<string, string> = {};
  for (const col of columns) {
    map[col.name] = String(col.id);
  }
  return map;
}

/**
 * Преобразует ContentEntry в формат данных строки (ключи = ID колонок)
 * @param entry - Запись контента
 * @param colMap - Маппинг имя → ID колонки
 * @returns Данные строки с ключами по ID колонок
 */
function entryToRowData(entry: ContentEntry, colMap: Record<string, string>): Record<string, string> {
  return {
    [colMap.key]: entry.key,
    [colMap.type]: entry.type,
    [colMap.sheet]: entry.sheet,
    [colMap.label]: entry.label,
    [colMap.value]: entry.value,
  };
}

/**
 * Извлекает значение поля из данных строки по ID колонки
 * @param data - Данные строки
 * @param colMap - Маппинг имя → ID колонки
 * @param field - Имя поля (key, type, value и т.д.)
 * @returns Значение поля
 */
function getField(data: Record<string, string>, colMap: Record<string, string>, field: string): string {
  return data[colMap[field]] || data[field] || "";
}

/**
 * Синхронизирует контент из JSON сценария в таблицу _content
 * @param projectId - ID проекта
 * @param scenarioData - JSON данные сценария (объект с sheets[])
 */
export async function syncContentToTable(projectId: number, scenarioData: any): Promise<void> {
  const tableId = await ensureContentTable(projectId);
  const colMap = await getColumnIdMap(tableId);

  const sheets = scenarioData?.sheets || [];
  const entries = extractContentFromNodes(sheets);
  const limitedEntries = entries.slice(0, MAX_ENTRIES);

  const existingRows = await storage.getBotTableRows(tableId);
  const newKeys = new Set(limitedEntries.map((e) => e.key));

  // Индекс существующих строк по ключу
  const rowsByKey = new Map<string, BotTableRow>();
  for (const row of existingRows) {
    const data = row.data as Record<string, string>;
    const key = getField(data, colMap, "key");
    if (key) {
      rowsByKey.set(key, row);
    }
  }

  // Строки для создания
  const toCreate: ContentEntry[] = [];

  for (const entry of limitedEntries) {
    const existing = rowsByKey.get(entry.key);
    if (existing) {
      const data = existing.data as Record<string, string>;
      const curValue = getField(data, colMap, "value");
      const curLabel = getField(data, colMap, "label");
      const curSheet = getField(data, colMap, "sheet");
      if (curValue !== entry.value || curLabel !== entry.label || curSheet !== entry.sheet) {
        await storage.updateBotTableRow(existing.id, entryToRowData(entry, colMap));
      }
    } else {
      toCreate.push(entry);
    }
  }

  // Батч-создание новых строк
  if (toCreate.length > 0) {
    const nextIndex = existingRows.length;
    const inputs = toCreate.map((entry, i) => ({
      tableId,
      rowIndex: nextIndex + i,
      data: entryToRowData(entry, colMap),
    }));
    await storage.createBotTableRows(inputs);
  }

  // Удаление orphan-строк
  for (const row of existingRows) {
    const data = row.data as Record<string, string>;
    const key = getField(data, colMap, "key");
    const type = getField(data, colMap, "type");
    if (key && !newKeys.has(key) && type !== "manual") {
      await storage.deleteBotTableRow(row.id);
    }
  }
}
