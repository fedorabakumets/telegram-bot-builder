/**
 * @fileoverview Главная панель вкладки "Таблицы" — spreadsheet-интерфейс
 * @module editor/tables/tables-panel
 */

import { useState, useRef } from 'react';
import { useTablePreference } from './hooks/use-table-preference';
import { ArrowLeft, Table2 } from 'lucide-react';
import { TablesHeader } from './components/tables-header';
import './tables-theme.css';
import './tables-panel.css';
import './tables-surfaces.css';
import { TableList } from './components/table-list';
import { TableEditor } from './components/table-editor';
import { useTablesState } from './hooks/use-tables-state';
import type { TablesPanelProps } from './types';

/**
 * Панель управления таблицами проекта
 * @param props - Пропсы компонента
 * @returns JSX элемент панели таблиц
 */
export function TablesPanel({ sheets, projectId, allProjects, onProjectChange, selectedTokenId, onSelectToken }: TablesPanelProps) {
  /** Видимость списка управляется из шапки без пустой боковой полосы. */
  const [listCollapsed, setListCollapsed] = useTablePreference('tables:list-collapsed', false);
  const [mobileList, setMobileList] = useState(true);
  const backRef = useRef<HTMLButtonElement>(null);
  const {
    loading, loadError, retryLoad,
    tables,
    selectedTable: currentTable,
    selectedTableId,
    setSelectedTableId,
    createTable,
    deleteTable,
    addColumn,
    addAlphabetColumns,
    renameColumn,
    deleteColumn,
    addRows,
    deleteRow,
    reindexRows,
    updateCell,
    updateCells,
    importNewTable,
    importRows,
  } = useTablesState(projectId, selectedTokenId);

  /** Ранее выбранная системная таблица также скрывается без изменения данных. */
  const selectedTable = currentTable?.id.startsWith('_system_') ? null : currentTable;

  /** Общий редактор сохраняет одинаковые действия во всех размерах панели. */
  const editor = selectedTable ? (
    <TableEditor
            navigation={<button ref={backRef} type="button" onClick={() => setMobileList(true)} aria-label="К списку таблиц" title="К списку таблиц" className="table-view-back tables-control flex shrink-0 items-center gap-1 rounded-md border border-border px-3 py-2 text-sm sm:hidden"><ArrowLeft className="h-4 w-4 shrink-0" /><span>К списку таблиц</span></button>}
            key={`${projectId}:${selectedTable.id}`} sheets={sheets}
            loading={loading} loadError={loadError} onRetryLoad={retryLoad}
            projectId={projectId}
            table={selectedTable}
            readOnly={selectedTable.id.startsWith('_system_')}
            isContentTable={selectedTable.name === '_content'}
            systemInfo={selectedTable.id.startsWith('_system_')
              ? `Данные токена #${selectedTokenId ?? 'все'} • проект #${projectId}`
              : undefined
            }
            onAddColumn={(name) => addColumn(selectedTable.id, name)}
            onAddAlphabetColumns={() => addAlphabetColumns(selectedTable.id)}
            onRenameColumn={(colId, name) => renameColumn(selectedTable.id, colId, name)}
            onDeleteColumn={(colId) => deleteColumn(selectedTable.id, colId)}
            onAddRows={(count) => addRows(selectedTable.id, count)}
            onDeleteRow={(rowId) => deleteRow(selectedTable.id, rowId)}
            onReindex={() => reindexRows(selectedTable.id)}
            onUpdateCells={(edits) => updateCells(selectedTable.id, edits)}
            onUpdateCell={(rowId, colId, val, expected) => updateCell(selectedTable.id, rowId, colId, val, expected)}
            onImportNew={importNewTable}
            onImportRows={(rows) => importRows(selectedTable.id, rows)}
          />
  ) : null;

  return (
    <div className="tables-workspace flex flex-col h-full min-h-0 min-w-0 bg-background">
      <TablesHeader projectId={projectId} allProjects={allProjects} onProjectChange={onProjectChange}
        selectedTokenId={selectedTokenId} onSelectToken={onSelectToken}
        listCollapsed={listCollapsed} onToggleList={() => setListCollapsed((value) => !value)} />
      <div className="tables-body flex min-h-0 flex-1 overflow-hidden" data-mobile-list={mobileList || !selectedTable}>
        <div className="tables-nav min-h-0">
          <TableList collapsed={listCollapsed} tables={tables} selectedTableId={selectedTableId}
            onSelect={(id) => { setSelectedTableId(id); setMobileList(false); if (window.matchMedia('(max-width: 639px)').matches) requestAnimationFrame(() => backRef.current?.focus()); }}
            onCreate={createTable} onDelete={deleteTable} />
        </div>
        <div className="tables-editor flex min-h-0 min-w-0 flex-1 flex-col">
          {editor ?? <div className="flex min-w-0 flex-1 items-center justify-center p-6">
            <div className="max-w-sm space-y-4 text-center">
              <Table2 className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Откройте таблицу</h3>
              <p className="text-sm text-muted-foreground">Выберите таблицу в списке или создайте новую для своих данных.</p>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
