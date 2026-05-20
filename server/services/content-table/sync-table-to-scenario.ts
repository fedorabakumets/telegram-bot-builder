/**
 * @fileoverview Обратная синхронизация: обновление JSON сценария при изменении строки _content
 * @module services/content-table/sync-table-to-scenario
 */

import { storage } from "../../storages/storage";
import { parseContentKey } from "./content-key-parser";

/**
 * Обновляет JSON сценария проекта при изменении строки в таблице _content
 * @param projectId - ID проекта
 * @param tableId - ID таблицы _content
 * @param rowData - Данные строки (ключи = ID колонок или имена колонок)
 */
export async function syncTableToScenario(
  projectId: number,
  tableId: number,
  rowData: Record<string, string>,
): Promise<void> {
  const project = await storage.getBotProject(projectId);
  if (!project || !project.data) return;

  // Строим маппинг ID колонки → имя колонки
  const columns = await storage.getBotTableColumns(tableId);
  const idToName: Record<string, string> = {};
  for (const col of columns) {
    idToName[String(col.id)] = col.name;
  }

  // Нормализуем rowData: преобразуем ключи из ID в имена
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(rowData)) {
    const name = idToName[k] || k;
    normalized[name] = v;
  }

  if (!normalized.key || !normalized.type) return;

  const scenarioData = project.data as any;
  const sheets: any[] = scenarioData.sheets || [];

  const parsed = parseContentKey(normalized.key, normalized.type);
  const node = findNodeById(sheets, parsed.nodeId);
  if (!node) return;

  const data = node.data || {};
  const value = normalized.value || "";

  switch (parsed.field) {
    case "messageText":
      data.messageText = value;
      break;
    case "mediaCaption":
      data.mediaCaption = value;
      break;
    case "buttons":
      updateButton(data, parsed.subId!, parsed.subField!, value);
      break;
    case "media":
      updateMediaField(data, value);
      break;
    case "httpRequestUrl":
      data.httpRequestUrl = value;
      break;
    case "httpRequestBody":
      data.httpRequestBody = value;
      break;
    case "httpRequestHeaders":
      data.httpRequestHeaders = value;
      break;
    case "query":
      data.query = value;
      break;
    case "description":
      data.description = value;
      break;
    case "inputPrompt":
      data.inputPrompt = value;
      break;
    case "userbotEntity":
      data.userbotEntity = value;
      break;
    case "messageId":
      data.messageId = value;
      break;
    case "clickValue":
      data.clickValue = value;
      break;
    case "botUsername":
      data.botUsername = value;
      break;
    case "query":
      data.query = value;
      break;
    case "targetChat":
      data.targetChat = value;
      break;
  }

  node.data = data;
  await storage.updateBotProject(projectId, { data: scenarioData });
}

/**
 * Ищет ноду по ID во всех листах
 * @param sheets - Массив листов
 * @param nodeId - ID ноды
 * @returns Найденная нода или undefined
 */
function findNodeById(sheets: any[], nodeId: string): any | undefined {
  for (const sheet of sheets) {
    const nodes: any[] = sheet.nodes || [];
    const found = nodes.find((n: any) => n.id === nodeId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Обновляет поле кнопки в массиве buttons
 * @param data - Данные ноды
 * @param subId - ID кнопки
 * @param subField - Поле кнопки (text, url, webAppUrl)
 * @param value - Новое значение
 */
function updateButton(data: any, subId: string, subField: string, value: string): void {
  const buttons: any[] = data.buttons || [];
  const btn = buttons.find((b: any) => b.id === subId);
  if (btn) {
    btn[subField] = value;
  }
}

/**
 * Обновляет медиа-поле ноды (определяет конкретное поле по наличию)
 * @param data - Данные ноды
 * @param value - Новое значение URL
 */
function updateMediaField(data: any, value: string): void {
  if (data.imageUrl !== undefined) {
    data.imageUrl = value;
  } else if (data.videoUrl !== undefined) {
    data.videoUrl = value;
  } else if (data.audioUrl !== undefined) {
    data.audioUrl = value;
  } else if (data.documentUrl !== undefined) {
    data.documentUrl = value;
  } else {
    // По умолчанию — imageUrl
    data.imageUrl = value;
  }
}
