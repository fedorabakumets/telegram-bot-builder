/** @fileoverview Одноколоночное представление контента с метаданными и редактором в одной записи. */
import { Fragment } from 'react';
import { Trash2 } from 'lucide-react';
import { ContentNodeLink } from './content-node-link';
import { SpreadsheetCell } from './spreadsheet-cell';
import { getColumnTitle } from '../utils/display-labels';
import { useTableWindow } from '../hooks/use-table-window';
import type { TableGridProps } from './table-grid';
import '../content-table-grid.css';
/**
 * Объединяет ноду, тип, лист и содержимое в единственный столбец без изменения данных.
 * @param props - Таблица контента и настройки текущей выборки.
 * @returns Одноколоночная таблица с выделением и редактированием записей.
 */
export function ContentTableGrid({ editor, view }: TableGridProps) {
  const { table, projectId, readOnly, onUpdateCell, onDeleteRow } = editor;
  const key = table.columns.find((column) => column.name === 'key');
  const value = table.columns.find((column) => column.name === 'value');
  const metadata = table.columns.filter((column) => !['key', 'value'].includes(column.name));
  const windowed = useTableWindow(view.rows, view.activeCell?.rowId, 160, JSON.stringify([view.search, view.selectedType, view.selectedSheet, view.columnFilters, view.sort]));
  return <table aria-label="Контент сценария" aria-rowcount={view.rows.length + 1} className={`table-data-grid content-table-grid ${view.wrap ? 'table-wrap' : ''}`}>
    <thead><tr><th scope="col">
      <div className="content-table-heading">
        <label className="table-number"><input type="checkbox" aria-label="Выбрать все найденные строки"
          checked={view.rows.length > 0 && view.rows.every((row) => view.selected.has(row.id))}
          ref={(input) => { if (input) input.indeterminate = view.rows.some((row) => view.selected.has(row.id)) && !view.rows.every((row) => view.selected.has(row.id)); }}
          onChange={(event) => view.setSelected((previous) => { const next = new Set(previous); view.rows.forEach((row) => event.target.checked ? next.add(row.id) : next.delete(row.id)); return next; })} />
        </label>
        <span>Нода и содержимое</span><span className="ml-auto text-xs text-muted-foreground tabular-nums">Записей: {view.rows.length}</span>
      </div>
      <details className="content-table-options" open={Object.values(view.columnFilters).some(Boolean) || undefined}>
        <summary>Поиск по полям и сортировка</summary>
        <div className="content-table-fields">{table.columns.map((column) => <label key={column.id} className="text-xs text-muted-foreground">
          <span>{column.name === 'key' ? 'ID ноды' : getColumnTitle(column)}</span>
          <div className="flex items-center gap-2"><input aria-label={`Поиск по полю: ${getColumnTitle(column)}`} value={view.columnFilters[column.id] ?? ''}
            onChange={(event) => view.setColumnFilters((previous) => ({ ...previous, [column.id]: event.target.value }))} className="min-w-0 flex-1 rounded border border-border px-2 py-1 text-sm font-normal" />
            <button type="button" aria-label={`Сортировать: ${getColumnTitle(column)}`} className="tables-control rounded p-2"
              onClick={() => view.setSort(view.sort?.column === column.id && view.sort.direction === -1 ? null : { column: column.id, direction: view.sort?.column === column.id ? -1 : 1 })}>
              {view.sort?.column === column.id ? view.sort.direction === 1 ? '↑' : '↓' : '↕'}
            </button></div>
        </label>)}</div>
      </details>
    </th></tr></thead>
    <tbody>{windowed.indices.map((rowIndex, position) => {
      const row = view.rows[rowIndex];
      const previous = position === 0 ? 0 : windowed.indices[position - 1] + 1;
      const gap = windowed.offsets[rowIndex] - windowed.offsets[previous];
      return <Fragment key={row.id}>
        {gap > 0 && <tr className="table-spacer" aria-hidden="true"><td style={{ height: gap }} /></tr>}
        <tr ref={(element) => windowed.measure(row.id, element)} data-row-id={row.id} aria-rowindex={rowIndex + 2}><td>
          <div className="content-table-entry">
            <div className="content-table-entry-heading">
              <label className="table-number"><input type="checkbox" aria-label={`Выбрать строку ${row.rowIndex}`} checked={view.selected.has(row.id)}
                onChange={(event) => view.setSelected((previous) => { const next = new Set(previous); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next; })} /><span>{row.rowIndex}</span></label>
              <div className="min-w-0 flex-1">{key && <ContentNodeLink projectId={projectId} contentKey={row.cells[key.id] ?? ''} record={view.records.get(row.id)} />}</div>
              {!readOnly && <button type="button" aria-label={`Удалить строку ${row.rowIndex}`} className="tables-control rounded p-2 text-muted-foreground hover:text-destructive" onClick={() => onDeleteRow(row.id)}><Trash2 className="h-4 w-4" /></button>}
            </div>
            <div className="content-table-metadata">{metadata.map((column) => <span key={column.id}>{getColumnTitle(column)}: {row.cells[column.id] || '—'}</span>)}</div>
            {value && (readOnly ? <div className="table-static-cell">{row.cells[value.id]}</div> : <SpreadsheetCell draftKey={`${row.id}:${value.id}`} settings={value.settings} value={row.cells[value.id] ?? ''}
              onChange={(text, expected) => onUpdateCell(row.id, value.id, text, expected)} isFocused={view.activeCell?.rowId === row.id && view.activeCell.columnId === value.id}
              onFocus={() => view.setActiveCell({ rowId: row.id, columnId: value.id })} onBlurCell={() => view.setActiveCell(null)}
              onNavigate={(direction) => { const target = rowIndex + (direction === 'left' || direction === 'up' ? -1 : 1); if (target >= 0 && target < view.rows.length) { windowed.reveal(target); view.setActiveCell({ rowId: view.rows[target].id, columnId: value.id }); } }} />)}
          </div>
        </td></tr>
      </Fragment>;
    })}
    {windowed.indices.length > 0 && windowed.indices[windowed.indices.length - 1] < view.rows.length - 1 && <tr className="table-spacer" aria-hidden="true"><td style={{ height: windowed.offsets[view.rows.length] - windowed.offsets[windowed.indices[windowed.indices.length - 1] + 1] }} /></tr>}
    {view.rows.length === 0 && <tr><td><p className="p-6 text-center text-sm text-muted-foreground">Записи не найдены. Измените поиск или сбросьте фильтры.</p></td></tr>}
    </tbody>
  </table>;
}
