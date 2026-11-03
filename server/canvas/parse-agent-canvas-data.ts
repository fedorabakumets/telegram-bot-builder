/** @fileoverview Проверка снимка для рассылки холста с сохранением дополнительных полей. */
import { botDataSchema, botDataWithSheetsSchema, type BotDataWithSheets } from '@shared/schema';
import { migrateLegacyData } from '@shared/sheets/sheet-migration';

/**
 * Возвращает проверенные значения вместе с полями, неизвестными схеме.
 * @param parsed - Проверенная часть снимка
 * @param original - Исходное значение с дополнительными полями
 * @returns Проверенная структура, дополненная исходными полями
 */
function preserveExtraFields<T>(parsed: T, original: unknown): T {
  if (Array.isArray(parsed)) {
    const source = Array.isArray(original) ? original : [];
    return parsed.map((item, index) => preserveExtraFields(item, source[index])) as T;
  }
  if (parsed === null || typeof parsed !== 'object' || parsed instanceof Date) return parsed;
  if (original === null || typeof original !== 'object' || Array.isArray(original)) return parsed;
  const result: Record<string, unknown> = { ...original };
  for (const [key, value] of Object.entries(parsed)) {
    result[key] = preserveExtraFields(value, (original as Record<string, unknown>)[key]);
  }
  return result as T;
}

/**
 * Проверяет снимок, мигрирует старый формат и сохраняет дополнительные поля.
 * @param data - Данные проекта из хранилища
 * @returns Проверенный снимок либо null для неподдерживаемых данных
 */
export function parseAgentCanvasData(data: unknown): BotDataWithSheets | null {
  if (!data || typeof data !== 'object') return null;
  if ('sheets' in data) {
    if (!Array.isArray(data.sheets)) return null;
    const result = botDataWithSheetsSchema.safeParse(data);
    return result.success ? preserveExtraFields(result.data, data) : null;
  }
  const legacy = botDataSchema.safeParse(data);
  if (!legacy.success) return null;
  const migrated = migrateLegacyData(preserveExtraFields(legacy.data, data));
  return preserveExtraFields(migrated, data);
}
