/** @fileoverview Общий контракт встроенного импорта таблиц без файловых путей. */
import { z } from 'zod';
import { tableColumnSettingsSchema } from './table-column-settings';
/** Переносимая пользовательская таблица с данными по порядку колонок. */
export const tableBundleItemSchema = z.object({
  /** Имя таблицы. */ name: z.string().trim().min(1).max(255).refine(value => value !== '_content', 'Служебную таблицу импортировать нельзя'),
  /** Уникальные нормализованные имена столбцов. */ columns: z.array(z.string().trim().min(1).max(255)).min(1),
  /** Подписи и ограничения колонок. */ columnSettings: z.array(tableColumnSettingsSchema).optional(),
  /** Значения строк. */ rows: z.array(z.array(z.string().max(10000))).max(200),
}).superRefine((table, ctx) => {
  if (new Set(table.columns).size !== table.columns.length) ctx.addIssue({ code: 'custom', message: 'Имена столбцов должны быть уникальны после удаления пробелов' });
  if (table.columnSettings && table.columnSettings.length !== table.columns.length) ctx.addIssue({ code: 'custom', message: 'Число настроек должно совпадать с числом столбцов' });
  if (table.rows.some(row => row.length !== table.columns.length)) ctx.addIssue({ code: 'custom', message: 'Ширина строки должна совпадать с числом столбцов' });
});
/** Встроенный пакет версии 1; запись выполняет существующий HTTP API. */
export const tableBundleSchema = z.object({
  /** Версия формата. */ version: z.literal(1).default(1),
  /** Таблицы для переноса. */ tables: z.array(tableBundleItemSchema).min(1).max(50),
}).superRefine((bundle, ctx) => {
  if (new Set(bundle.tables.map(table => table.name)).size !== bundle.tables.length) ctx.addIssue({ code: 'custom', message: 'Имена таблиц пакета должны быть уникальны после удаления пробелов' });
});
