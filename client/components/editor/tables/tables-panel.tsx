/**
 * @fileoverview Главная панель вкладки "Таблицы" — spreadsheet-интерфейс
 * @module editor/tables/tables-panel
 */

import { Table2, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TabHeader } from '@/components/ui/tab-header';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';
import { BotTokenSelector } from '@/components/editor/database/user-database/components/header/bot-token-selector';
import { useProjectTokens } from '@/hooks/use-project-tokens';
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
  const projectTokensInfo = useProjectTokens([projectId]);
  const tokens = projectTokensInfo[0]?.tokens ?? [];
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
      <TabHeader
        icon={<Table2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Таблицы"
        actions={
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
        }
      >
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
        {tokens.length > 0 && onSelectToken && (
          <BotTokenSelector
            tokens={tokens}
            selectedTokenId={selectedTokenId ?? null}
            onSelect={(id) => onSelectToken(id)}
          />
        )}
      </TabHeader>

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
