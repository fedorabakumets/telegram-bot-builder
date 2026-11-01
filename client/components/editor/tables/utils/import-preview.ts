/** @fileoverview Проверка формы файла и сопоставления столбцов до импорта. */
import { validateColumnValue } from '@shared/table-column-settings';
import type { TableColumn } from '../types';
/**
 * Находит ошибки до добавления новых строк или новой таблицы.
 * @param columns - Имена столбцов файла.
 * @param rows - Строки файла.
 * @param target - Столбцы назначения при добавлении в существующую таблицу.
 * @param mode - Импорт диапазона или восстановление общего файла, включая пустые таблицы.
 * @returns Список ошибок, блокирующих импорт.
 */
export function validateImportPreview(columns: string[], rows: string[][], target?: TableColumn[], mode: 'append' | 'bundle' = 'append'): string[] {
  const errors: string[] = [];
  if (mode !== 'bundle' && (!columns.length || !rows.length)) errors.push('В файле нет столбцов или строк');
  if (columns.some((name) => !name.trim())) errors.push('У каждого столбца должно быть имя');
  if (new Set(columns.map((name) => name.trim())).size !== columns.length) errors.push('Имена столбцов файла повторяются');
  if (mode === 'append' && target && rows.length > 200) errors.push('За один импорт в существующую таблицу можно добавить до 200 строк');
  if (target && columns.length !== target.length) errors.push(`В файле ${columns.length} столбцов, в таблице ${target.length}. Сопоставьте структуру файла перед импортом.`);
  rows.forEach((row, index) => { if (row.length > columns.length) errors.push(`Строка ${index + 1}: ячеек больше, чем столбцов`); if (row.some((value) => value.length > 10000)) errors.push(`Строка ${index + 1}: слишком длинное значение`); });
  if (target) rows.forEach((row, ri) => target.forEach((column, ci) => {
    const error = validateColumnValue(row[ci] ?? '', column.settings);
    if (error) errors.push(`Строка ${ri + 1}, ${column.settings?.displayName || column.name}: ${error}`);
  }));
  return errors;
}
