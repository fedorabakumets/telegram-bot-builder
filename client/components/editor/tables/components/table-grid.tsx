/** @fileoverview Сетка таблицы с закреплёнными столбцами и редактированием ячеек. */
import { Fragment } from 'react';
import { useTableWindow } from '../hooks/use-table-window';
import { defaultColumnWidth } from '../utils/column-layout';
import { Trash2 } from 'lucide-react';
import { SpreadsheetCell } from './spreadsheet-cell';
import { ContentNodeLink } from './content-node-link';
import { TableGridHeader } from './table-grid-header';
import type { TableEditorProps } from '../editor-types';
import type { TableView } from '../hooks/use-table-view';
/** Свойства сетки таблицы. */
interface TableGridProps {
  /** Контракт редактора. */
  editor: TableEditorProps;
  /** Найденные строки и настройки. */
  view: TableView;
}
/**
 * Отображает записи и поддерживает переходы между доступными для редактирования ячейками.
 * @param props - Редактор и представление.
 * @returns Сетка данных.
 */
export function TableGrid({ editor, view }: TableGridProps) {
  const { table, readOnly, isContentTable, projectId, onUpdateCell, onDeleteRow } = editor;
  const editable = table.columns.map((column, index) => !readOnly && (!isContentTable || column.name === 'value') ? index : -1).filter((index) => index >= 0);
  const windowed = useTableWindow(view.rows, view.activeCell?.rowId, isContentTable ? 80 : 40, JSON.stringify([view.search, view.selectedType, view.selectedSheet, view.columnFilters, view.sort]));
  return (
    <table aria-rowcount={view.rows.length + 1} className={`table-data-grid ${view.wrap ? 'table-wrap' : ''}`} style={{ width: 56 + table.columns.reduce((sum, column) => sum + (view.widths[column.id] ?? defaultColumnWidth(column)), 0) + (readOnly ? 0 : 40) }}>
      <TableGridHeader editor={editor} view={view} />
      <tbody>
        {windowed.indices.map((rowIndex, position) => {
          const row = view.rows[rowIndex];
          const previous = position === 0 ? 0 : windowed.indices[position - 1] + 1;
          const gap = windowed.offsets[rowIndex] - windowed.offsets[previous];
          return <Fragment key={row.id}>
          {gap > 0 && <tr className="table-spacer" aria-hidden="true"><td colSpan={table.columns.length + 2} style={{ height: gap }} /></tr>}
          <tr ref={(element) => windowed.measure(row.id, element)} data-row-id={row.id} aria-rowindex={rowIndex + 2}>
            <td className="table-number"><input type="checkbox" aria-label={`Выбрать строку ${row.rowIndex}`} checked={view.selected.has(row.id)}
              onChange={(event) => view.setSelected((previous) => { const next = new Set(previous); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} /> {row.rowIndex}</td>
            {table.columns.map((column, columnIndex) => {
              const locked = !editable.includes(columnIndex);
              return (
                <td key={column.id} className={columnIndex === 0 ? 'table-primary' : ''}>
                  {isContentTable && column.name === 'key' ? <ContentNodeLink projectId={projectId} contentKey={row.cells[column.id] ?? ''} record={view.records.get(row.id)} /> : locked ?
                    <span title="Только чтение" className="table-static-cell block truncate px-3 py-2 text-sm text-muted-foreground">{row.cells[column.id] ?? ''}</span> :
                    <SpreadsheetCell draftKey={`${row.id}:${column.id}`} settings={column.settings} value={row.cells[column.id] ?? ''} onChange={(value, expected) => onUpdateCell(row.id, column.id, value, expected)} isFocused={view.activeCell?.rowId === row.id && view.activeCell.columnId === column.id}
                      onFocus={() => view.setActiveCell({ rowId: row.id, columnId: column.id })} onBlurCell={() => view.setActiveCell(null)}
                      onNavigate={(direction) => {
                        const current = rowIndex * editable.length + editable.indexOf(columnIndex);
                        const target = current + (direction === 'left' ? -1 : direction === 'right' ? 1 : direction === 'up' ? -editable.length : editable.length);
                        if (target >= 0 && target < view.rows.length * editable.length) { const nextRow = Math.floor(target / editable.length); windowed.reveal(nextRow); view.setActiveCell({ rowId: view.rows[nextRow].id, columnId: table.columns[editable[target % editable.length]].id }); }
                      }} />}
                </td>
              );
            })}
            {!readOnly && <td><button type="button" aria-label={`Удалить строку ${row.rowIndex}`} className="tables-control rounded p-2 text-muted-foreground hover:text-destructive" onClick={() => onDeleteRow(row.id)}><Trash2 className="h-4 w-4" /></button></td>}
          </tr></Fragment>;
        })}
        {windowed.indices.length > 0 && windowed.indices[windowed.indices.length - 1] < view.rows.length - 1 && <tr className="table-spacer" aria-hidden="true"><td colSpan={table.columns.length + 2} style={{ height: windowed.offsets[view.rows.length] - windowed.offsets[windowed.indices[windowed.indices.length - 1] + 1] }} /></tr>}
        {view.rows.length === 0 && <tr><td colSpan={table.columns.length + 2} className="p-6 text-center text-sm text-muted-foreground">Записи не найдены. Измените поиск или сбросьте фильтры.</td></tr>}
      </tbody>
    </table>
  );
}
