/** @fileoverview Подписи, типы и ограничения столбцов без изменения внутренних имён. */
import { z } from 'zod';
/** Настройки отображения и проверки значений столбца. */
export const tableColumnSettingsSchema = z.object({
  /** Подпись для пользователя, отдельно от имени в запросах бота. */
  displayName: z.string().trim().max(255).default(''),
  /** Тип значения; в хранилище значения остаются строками. */
  dataType: z.enum(['text', 'number', 'date', 'boolean', 'link']).default('text'),
  /** Обязательность заполнения. */
  required: z.boolean().default(false),
  /** Минимум для числового столбца. */
  min: z.number().finite().optional(),
  /** Максимум для числового столбца. */
  max: z.number().finite().optional(),
  /** Предельная длина текста. */
  maxLength: z.number().int().min(1).max(10000).default(10000),
}).strict().refine((value) => value.min === undefined || value.max === undefined || value.min <= value.max, { message: 'Минимум не может быть больше максимума' });
/** Настройки столбца в API и интерфейсе. */
export type TableColumnSettings = z.infer<typeof tableColumnSettingsSchema>;
/** Русские подписи доступных типов. */
export const columnDataTypes = { text: 'Текст', number: 'Число', date: 'Дата', boolean: 'Переключатель', link: 'Ссылка' } as const;
/**
 * Возвращает проверенные настройки или совместимые значения по умолчанию.
 * @param value - Настройки из базы данных.
 * @returns Нормализованные настройки столбца.
 */
export function columnSettings(value?: unknown): TableColumnSettings {
  const parsed = tableColumnSettingsSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : tableColumnSettingsSchema.parse({});
}
/**
 * Проверяет значение одинаково в ячейке, предпросмотре и при сохранении на сервере.
 * @param value - Значение ячейки.
 * @param settings - Настройки её столбца.
 * @returns Причина отказа или отсутствие ошибки.
 */
export function validateColumnValue(value: string, settings?: TableColumnSettings): string | null {
  const config = settings ?? columnSettings();
  if (value.length > config.maxLength) return `Допустимо не более ${config.maxLength} символов`;
  if (!value.trim()) return config.required ? 'Заполните обязательное поле' : null;
  if (config.dataType === 'number') {
    const number = Number(value.trim().replace(',', '.'));
    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim()) || !Number.isFinite(number)) return 'Введите число';
    if (config.min !== undefined && number < config.min) return `Минимум: ${config.min}`;
    if (config.max !== undefined && number > config.max) return `Максимум: ${config.max}`;
  }
  if (config.dataType === 'date') {
    const date = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return 'Введите существующую дату в формате ГГГГ-ММ-ДД';
  }
  if (config.dataType === 'boolean' && !['true', 'false'].includes(value)) return 'Выберите «Да» или «Нет»';
  if (config.dataType === 'link') {
    try { if (!['https:', 'http:', 'tg:'].includes(new URL(value).protocol)) return 'Укажите ссылку с протоколом https, http или tg'; }
    catch { return 'Введите полную ссылку, например https://example.com'; }
  }
  return null;
}
