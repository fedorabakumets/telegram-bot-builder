/** @fileoverview Единые начальные размеры столбцов сетки. */
import type { TableColumn } from '../types';
/**
 * Возвращает начальную ширину в координатах таблицы до применения масштаба.
 * @param column - Столбец таблицы.
 * @returns Ширина столбца в пикселях.
 */
export function defaultColumnWidth(column: TableColumn): number {
  return column.name === 'key' ? 272 : column.name === 'value' ? 400 : column.name === 'type' ? 120 : column.name === 'sheet' ? 136 : 180;
}
