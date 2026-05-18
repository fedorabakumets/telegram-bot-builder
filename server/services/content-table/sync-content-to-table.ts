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
 * Синхронизирует контент из JSON сценария в таблицу _content
 * @param projectId - ID проекта
 * @param scenarioData - JSON данные сценария (объект с sheets[])
 */
export async function syncContentToTable(projectId: number, scenarioData: any): Promise<void> {
  const tableId = await ensureContentTable(projectId);

  // Отладка: проверяем что приходит в scenarioData
  const sheets = scenarioData?.sheets || [];
  console.log(`[syncContentToTable] projectId=${projectId}, sheets=${sheets.length}, keys=${Object.keys(scenarioData || {}).join(',')}`);
  if (sheets.length > 0) {
    const totalNodes = sheets.reduce((sum: number, s: any) => sum + (s.nodes?.length || 0), 0);
    console.log(`[syncContentToTable] totalNodes=${totalNodes}`);
  }

  const entries = extractContentFromNodes(sheets);

  // Ограничение на количество записей
  const limitedEntries = entries.slice(0, MAX_ENTRIES);

  const existingRows = await storage.getBotTableRows(tableId);
  const newKeys = new Set(limitedEntries.map((e) => e.key));

  // Индекс существующих строк по ключу
  const rowsByKey = new Map<string, BotTableRow>();
  for (const row of existingRows) {
    const data = row.data as Record<string, string>;
    if (data.key) {
      rowsByKey.set(data.key, row);
    }
  }

  // Строки для создания
  const toCreate: ContentEntry[] = [];

  for (const entry of limitedEntries) {
    const existing = rowsByKey.get(entry.key);
    if (existing) {
      const data = existing.data as Record<string, string>;
      // Обновляем только если value изменился
      if (data.value !== entry.value || data.label !== entry.label || data.sheet !== entry.sheet) {
        await storage.updateBotTableRow(existing.id, {
          key: entry.key,
          type: entry.type,
          sheet: entry.sheet,
          label: entry.label,
          value: entry.value,
        });
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
      data: {
        key: entry.key,
        type: entry.type,
        sheet: entry.sheet,
        label: entry.label,
        value: entry.value,
      },
    }));
    await storage.createBotTableRows(inputs);
  }

  // Удаление orphan-строк (ключ не в новом наборе и нет флага manual)
  for (const row of existingRows) {
    const data = row.data as Record<string, string>;
    if (data.key && !newKeys.has(data.key) && data.type !== "manual") {
      await storage.deleteBotTableRow(row.id);
    }
  }
}
