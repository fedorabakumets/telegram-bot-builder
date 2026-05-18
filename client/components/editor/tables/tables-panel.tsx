/**
 * @fileoverview Главная панель вкладки "Таблицы" — spreadsheet-интерфейс
 * @module editor/tables/tables-panel
 */

import { Table2, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { TableList } from './components/table-list';
import { TableEditor } from './components/table-editor';
import { TableSwitcher } from './components/table-switcher';
import { AllTablesActions } from './components/all-tables-actions';
import { useTablesState } from './hooks/use-tables-state';
import type { TablesPanelProps } from './types';

/**
 * Панель управления таблицами проекта
 * @param props - Пропсы компонента
 * @returns JSX элемент панели таблиц
 */
export function TablesPanel({ projectId, allProjects, onProjectChange, selectedTokenId, onSelectToken }: TablesPanelProps) {
  const queryClient = useQueryClient();
  const {
    tables,
    selectedTable,
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
    importNewTable,
    importRows,
  } = useTablesState(projectId, selectedTokenId);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Шапка */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-muted/40 to-background">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2">
            <Table2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-none">Таблицы</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Данные проекта</p>
          </div>
          {/* Переключатель таблиц в шапке */}
          <TableSwitcher
            tables={tables}
            selectedTable={selectedTable}
            onSelect={setSelectedTableId}
          />
          {allProjects && allProjects.length > 1 && onProjectChange && (
            <ProjectSelector
              projects={allProjects}
              selectedProjectId={projectId}
              onSelect={onProjectChange}
            />
          )}
        </div>
        {/* Кнопка обновления + Экспорт/импорт всех таблиц */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['bot-tables'] })}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Обновить данные таблиц"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <AllTablesActions projectId={projectId} onImportTable={importNewTable} />
        </div>
      </div>

      {/* Контент: список таблиц + редактор */}
      <div className="flex flex-1 overflow-hidden">
        <TableList
          tables={tables}
          selectedTableId={selectedTableId}
          onSelect={setSelectedTableId}
          onCreate={createTable}
          onDelete={deleteTable}
        />

        {selectedTable ? (
          <TableEditor
            table={selectedTable}
            readOnly={selectedTable.id.startsWith('_system_')}
            onAddColumn={(name) => addColumn(selectedTable.id, name)}
            onAddAlphabetColumns={() => addAlphabetColumns(selectedTable.id)}
            onRenameColumn={(colId, name) => renameColumn(selectedTable.id, colId, name)}
            onDeleteColumn={(colId) => deleteColumn(selectedTable.id, colId)}
            onAddRows={(count) => addRows(selectedTable.id, count)}
            onDeleteRow={(rowId) => deleteRow(selectedTable.id, rowId)}
            onReindex={() => reindexRows(selectedTable.id)}
            onUpdateCell={(rowId, colId, val) => updateCell(selectedTable.id, rowId, colId, val)}
            onImportNew={importNewTable}
            onImportRows={(rows) => importRows(selectedTable.id, rows)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Table2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Выберите таблицу или создайте новую</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
