/** @fileoverview Подготовка снимка для рассылки холста с сохранением исходных данных. */
import { botDataSchema } from '@shared/schema';
import { migrateLegacyData } from '@shared/sheets/sheet-migration';

/** Снимок с неизменёнными значениями для отправки. */
export interface AgentCanvasSnapshot {
  /** Данные, полученные от API или преобразованные из старого формата. */
  data: unknown;
}

/**
 * Сохраняет исходные данные и переносит распознанный старый формат в листы.
 * @param data - Данные проекта из хранилища
 * @returns Снимок для отправки без потери сохранённых данных
 */
export function parseAgentCanvasData(data: unknown): AgentCanvasSnapshot {
  if (!data || typeof data !== 'object') return { data };
  if ('sheets' in data) {
    return { data };
  }
  if (!('nodes' in data) || !Array.isArray(data.nodes)) return { data };
  const nodes = data.nodes;
  const legacy = botDataSchema.safeParse(data);
  if (!legacy.success) return { data };
  const migrated = migrateLegacyData(legacy.data);
  return { data: {
    ...data,
    ...migrated,
    sheets: migrated.sheets.map((sheet) => ({
      ...sheet,
      nodes: nodes.length ? nodes : sheet.nodes,
    })),
  } };
}
