/** @fileoverview Заголовки таблицы с сортировкой, фильтрами и изменением ширины. */
import { defaultColumnWidth } from '../utils/column-layout';
import { Lock, PencilLine } from 'lucide-react';
import { useRef } from 'react';
import { ColumnHeader } from './column-header';
import { getColumnTitle } from '../utils/display-labels';
import type { TableEditorProps } from '../editor-types';
import type { TableView } from '../hooks/use-table-view';
/** Свойства заголовка сетки. */
interface TableGridHeaderProps {
  /** Контракт редактора. */
  editor: TableEditorProps;
  /** Текущее представление. */
  view: TableView;
}
/**
 * Отображает закреплённые заголовки и доступные ручки изменения ширины.
 * @param props - Таблица и настройки представления.
 * @returns Заголовок сетки.
 */
export function TableGridHeader({ editor, view }: TableGridHeaderProps) {
  const { table, readOnly, isContentTable, onDeleteColumn } = editor;
  const drag = useRef<{ start: number; width: number } | null>(null);
  return (
    <thead>
      <tr>
        <th className="table-number" scope="col"><input type="checkbox" aria-label="Выбрать все найденные строки"
          checked={view.rows.length > 0 && view.rows.every((row) => view.selected.has(row.id))}
          ref={(input) => { if (input) input.indeterminate = view.rows.some((row) => view.selected.has(row.id)) && !view.rows.every((row) => view.selected.has(row.id)); }}
          onChange={(event) => view.setSelected((previous) => { const next = new Set(previous); view.rows.forEach((row) => event.target.checked ? next.add(row.id) : next.delete(row.id)); return next; })} /> №</th>
        {table.columns.map((column, index) => (
          <th key={column.id} scope="col" className={index === 0 ? 'table-primary' : ''} style={{ width: view.widths[column.id] ?? defaultColumnWidth(column) }}>
            <div className="flex min-w-0 items-center gap-1 pr-3">
              {readOnly || isContentTable ? <span className="truncate px-2 py-2 text-sm" title={column.name}>{column.name === 'key' ? 'Нода и поле' : getColumnTitle(column)}</span> :
                <ColumnHeader column={column} projectId={editor.projectId} tableId={table.id} onDelete={() => onDeleteColumn(column.id)} />}
              {(readOnly || (isContentTable && column.name !== 'value')) ? <span title="Только чтение"><Lock aria-label="Только чтение" className="h-3 w-3 shrink-0 text-muted-foreground" /></span> : isContentTable ? <span title="Можно редактировать"><PencilLine aria-label="Можно редактировать" className="h-3 w-3 text-muted-foreground" /></span> : null}
              <button type="button" aria-label={`Сортировать: ${getColumnTitle(column)}`} title="Сортировать" className="tables-control ml-auto rounded px-2 py-1 text-xs"
                onClick={() => view.setSort(view.sort?.column === column.id && view.sort.direction === -1 ? null : { column: column.id, direction: view.sort?.column === column.id ? -1 : 1 })}>
                {view.sort?.column === column.id ? view.sort.direction === 1 ? '↑' : '↓' : '↕'}
              </button>
            </div>
            <input aria-label={isContentTable && column.name === 'key' ? 'Поиск по ID ноды' : `Поиск по столбцу: ${getColumnTitle(column)}`} placeholder={isContentTable && column.name === 'key' ? 'Поиск по ID ноды' : `Поиск: ${getColumnTitle(column)}`}
              title={isContentTable && column.name === 'key' ? 'Оставляет строки, в ID которых есть введённый текст' : `Оставляет строки, где «${getColumnTitle(column)}» содержит введённый текст`} value={view.columnFilters[column.id] ?? ''}
              onChange={(event) => view.setColumnFilters((previous) => ({ ...previous, [column.id]: event.target.value }))} className="table-column-filter mx-2 mb-2 rounded border border-border bg-transparent px-2 py-1 text-xs font-normal" />
            <div role="separator" aria-label={`Ширина столбца: ${getColumnTitle(column)}`} aria-orientation="vertical" tabIndex={0}
              aria-valuemin={120} aria-valuemax={1200} aria-valuenow={view.widths[column.id] ?? defaultColumnWidth(column)} className="table-column-resizer"
              onPointerDown={(event) => { const width = event.currentTarget.parentElement!.getBoundingClientRect().width; drag.current = { start: event.clientX, width }; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={(event) => { if (!drag.current) return; const factor = event.currentTarget.parentElement!.offsetWidth / event.currentTarget.parentElement!.getBoundingClientRect().width; const width = Math.max(120, Math.min(1200, (drag.current.width + event.clientX - drag.current.start) * factor)); view.setWidths((previous) => ({ ...previous, [column.id]: width })); }}
              onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
              onKeyDown={(event) => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); view.setWidths((previous) => ({ ...previous, [column.id]: Math.max(120, Math.min(1200, (previous[column.id] ?? defaultColumnWidth(column)) + (event.key === 'ArrowRight' ? 24 : -24))) })); }} />
          </th>
        ))}
        {!readOnly && <th className="w-10" aria-label="Действия строки" />}
      </tr>
    </thead>
  );
}
