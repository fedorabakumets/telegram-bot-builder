/** @fileoverview Составной редактор таблицы: поиск, фильтры, сетка и операции со строками. */
import { createCellDraftStore } from '../hooks/cell-draft-store';
import { CellDraftContext } from '../hooks/use-cell-draft';
import { useState } from 'react';
import { TableBulkActions } from './table-bulk-actions';
import { TableBulkDialog } from './table-bulk-dialog';
import { SpreadsheetToolbar } from './spreadsheet-toolbar';
import { AddRowsFooter } from './add-rows-footer';
import { TableZoom } from './table-zoom';
import { ContentTableFilters } from './content-table-filters';
import { TableViewToolbar } from './table-view-toolbar';
import { useTableHistory } from '../hooks/use-table-history';
import { TableHistoryToolbar } from './table-history-toolbar';
import { TableGrid } from './table-grid';
import { TableAddColumn } from './table-add-column';
import { useTableView } from '../hooks/use-table-view';
import type { TableEditorProps } from '../editor-types';
import '../table-grid.css';
/**
 * Объединяет независимые панели и сохраняет исходные идентификаторы данных.
 * @param props - Таблица, сценарий и обработчики операций.
 * @returns Рабочая область редактирования данных.
 */
export function TableEditor(props: TableEditorProps) {
  const { table, projectId, sheets, readOnly, isContentTable, onAddAlphabetColumns, onAddColumn, onAddRows, onReindex, onImportNew, onImportRows } = props;
  const [draftStore] = useState(createCellDraftStore);
  const view = useTableView(table, projectId, sheets);
  const [operation, setOperation] = useState<{ /** Режим изменения диапазона. */ mode: 'replace' | 'paste'; /** Данные из события вставки. */ text?: string } | null>(null);
  const selectedRows = table.rows.filter((row) => view.selected.has(row.id));
  const history = useTableHistory(props.onUpdateCells);
  return (
    <CellDraftContext.Provider value={draftStore}><section aria-label="Редактор таблицы" className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      onPaste={readOnly ? undefined : (event) => {
        if ((event.target as HTMLElement).closest('textarea, input')) return;
        const text = event.clipboardData.getData('text/plain');
        if (!text.includes('\t') && !text.includes('\n')) return;
        event.preventDefault(); setOperation({ mode: 'paste', text });
      }}>
      {isContentTable && <ContentTableFilters rows={table.rows} columns={table.columns} selectedType={view.selectedType} selectedSheet={view.selectedSheet} onTypeChange={view.setSelectedType} onSheetChange={view.setSelectedSheet} />}
      <TableViewToolbar view={view} total={table.rows.length} loading={props.loading}>
        {!readOnly && !isContentTable && <SpreadsheetToolbar table={table} onAddAlphabet={onAddAlphabetColumns} onAdd100Rows={() => onAddRows(100)} onReindex={onReindex} onImportNew={onImportNew} onImportRows={onImportRows} hasSelectedTable />}
        <TableBulkActions table={table} view={view} disabled={!!readOnly || history.pending} onOpen={(mode) => setOperation({ mode })} />
      </TableViewToolbar>
      {operation && <TableBulkDialog mode={operation.mode} initialText={operation.text} table={table} rows={operation.mode === 'replace' && selectedRows.length ? selectedRows : view.rows}
        rowId={view.activeCell?.rowId} columnId={view.activeCell?.columnId} onApply={history.commitBatch} onClose={() => setOperation(null)} />}
      {props.loadError && <div role="alert" className="flex shrink-0 items-center gap-3 px-4 py-2 text-sm text-destructive">{props.loadError}<button type="button" onClick={props.onRetryLoad} className="tables-control rounded-md border border-border px-3 py-1">Повторить загрузку</button></div>}
      <TableZoom controls={!readOnly && <TableHistoryToolbar history={history} />} storageKey={`tables:${projectId}:${table.id}:scale`}>{props.loading ? <div role="status" aria-label="Загрузка строк" className="space-y-3 p-4">{[0, 1, 2, 3, 4].map((index) => <div key={index} className="h-8 rounded bg-muted/40 motion-safe:animate-pulse" />)}</div> : <TableGrid editor={{ ...props, onUpdateCell: history.commit }} view={view} />}</TableZoom>
      {!readOnly && !isContentTable && <TableAddColumn onAdd={onAddColumn} />}
      {!readOnly && <AddRowsFooter onAddRows={onAddRows} />}
    </section></CellDraftContext.Provider>
  );
}
