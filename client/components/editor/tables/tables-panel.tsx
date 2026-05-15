/**
 * @fileoverview Главная панель вкладки "Таблицы"
 * @module editor/tables/tables-panel
 */

import { Table2 } from 'lucide-react';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { TableList } from './components/table-list';
import { TableEditor } from './components/table-editor';
import { useTablesState } from './hooks/use-tables-state';
import type { TablesPanelProps } from './types';

/**
 * Панель управления таблицами проекта
 * @param props - Пропсы компонента
 * @returns JSX элемент панели таблиц
 */
export function TablesPanel({ projectId, allProjects, onProjectChange }: TablesPanelProps) {
  const {
    tables,
    selectedTable,
    selectedTableId,
    setSelectedTableId,
    createTable,
    deleteTable,
    addColumn,
    addRow,
    deleteRow,
    deleteColumn,
    updateCell,
  } = useTablesState(projectId);

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
          {allProjects && allProjects.length > 1 && onProjectChange && (
            <ProjectSelector
              projects={allProjects}
              selectedProjectId={projectId}
              onSelect={onProjectChange}
            />
          )}
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
            onAddColumn={(col) => addColumn(selectedTable.id, col)}
            onDeleteColumn={(colId) => deleteColumn(selectedTable.id, colId)}
            onAddRow={() => addRow(selectedTable.id)}
            onDeleteRow={(rowId) => deleteRow(selectedTable.id, rowId)}
            onUpdateCell={(rowId, colId, val) => updateCell(selectedTable.id, rowId, colId, val)}
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
