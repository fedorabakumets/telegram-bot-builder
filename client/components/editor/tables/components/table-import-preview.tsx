/** @fileoverview Предпросмотр добавляемых строк и назначения столбцов файла. */
import type { TableColumn } from '../types';
import { getColumnLabel } from '../utils/display-labels';
/** Свойства просмотра файла. */
interface TableImportPreviewProps {
  /** Столбцы файла. */
  columns: string[];
  /** Строки файла. */
  rows: string[][];
  /** Столбцы назначения для добавления в таблицу. */
  target?: TableColumn[];
}
/**
 * Показывает структуру и первые строки до подтверждения импорта.
 * @param props - Данные файла и назначение.
 * @returns Предпросмотр, не изменяющий данные.
 */
export function TableImportPreview({ columns, rows, target }: TableImportPreviewProps) {
  return <div className="space-y-2">
    <p className="text-sm">Будет добавлено строк: {rows.length}. Существующие строки сохранятся.</p>
    <div className="max-h-64 overflow-auto rounded-md border border-border"><table className="w-full text-left text-sm">
      <thead><tr>{columns.map((name, index) => <th key={index} className="p-2">{name}{target && <span className="block text-xs text-muted-foreground">→ {getColumnLabel(target[index]?.name ?? 'Нет столбца')}</span>}</th>)}</tr></thead>
      <tbody>{rows.slice(0, 20).map((row, index) => <tr key={index}>{columns.map((_, ci) => <td key={ci} className="max-w-64 whitespace-pre-wrap break-words p-2">{row[ci] ?? ''}</td>)}</tr>)}</tbody>
    </table></div>
    {rows.length > 20 && <p className="text-xs text-muted-foreground">Показаны первые 20 строк</p>}
  </div>;
}
