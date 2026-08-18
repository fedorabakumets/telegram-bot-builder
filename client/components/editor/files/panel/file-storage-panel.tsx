/**
 * @fileoverview Переиспользуемая панель файлового хранилища (`FileStoragePanel`).
 * Единственная реализация логики и UI вкладки/модалки: рендерится и как
 * полноэкранная страница (mode='page'), и внутри закрываемого окна
 * (mode='modal'). Вся оркестрация состояния вынесена в хук
 * useFileStoragePanelState; презентация — в дочерние компоненты (задачи 5.2–5.5,
 * 6.x, 7.x). Контейнеры FilesTabPage/FileStorageModal — тонкие обёртки
 * (Req 1.1, 1.2, 1.6, 3.7).
 * @module components/editor/files/panel/file-storage-panel
 */

import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useFileStoragePanelState } from './use-file-storage-panel-state';
import { FileStorageHeader } from './file-storage-header';
import { FileStorageToolbar } from './file-storage-toolbar';
import { FileAttachHint } from './file-attach-hint';
import { FiltersRow } from './filters-row';
import { FiltersModal } from './filters-modal';
import { SelectionActionBar } from './selection-action-bar';
import { FilesTable } from './table/files-table';
import { FileStoragePagination } from './file-storage-pagination';
import { FILE_STORAGE_ACTIONS_ROW_CLASS } from './panel-styles';
import type { FileStoragePanelProps } from './panel-types';

/**
 * Панель файлового хранилища — общее ядро страницы и модалки.
 * @param props - Свойства панели (режим, проект, цель прикрепления, колбэки)
 * @returns JSX элемент панели
 */
export function FileStoragePanel(props: FileStoragePanelProps) {
  const { mode, attachTarget, projectId, selectedTokenId, onSelectToken, allProjects, onProjectChange, allSheets, onGoToNode } = props;
  const s = useFileStoragePanelState(props);

  /** В модалке min-h-0, чтобы таблица скроллилась внутри фиксированной высоты */
  const rootClassName =
    mode === 'modal'
      ? 'flex min-h-0 h-full flex-1 flex-col overflow-hidden bg-background'
      : 'flex h-full flex-col bg-background';

  return (
    <div className={rootClassName} data-testid="file-storage-panel" data-mode={mode}>
      <FileStorageHeader
        mode={mode}
        projectId={projectId}
        tokens={s.tokens}
        selectedTokenId={selectedTokenId ?? null}
        onSelectToken={onSelectToken}
        allProjects={allProjects}
        onProjectChange={onProjectChange}
        onRefresh={s.refresh}
        onUploaded={s.handleUploaded}
      />

      <FileAttachHint
        mode={mode}
        attachModeEnabled={s.attachModeEnabled}
        hasTarget={!!attachTarget}
        nodeLabel={attachTarget?.nodeLabel}
      />

      <FileStorageToolbar
        category={s.category}
        onCategoryChange={s.setCategory}
        usedBytes={s.quota.usedBytes}
        limitBytes={s.quota.limitBytes}
        quotaLoading={s.quota.isLoading}
      />

      {/* Фильтры + режим прикрепления в одной строке */}
      <div className={FILE_STORAGE_ACTIONS_ROW_CLASS}>
        <FiltersRow
          embedded
          filters={s.filters}
          activeCount={s.activeFilterCount}
          onOpen={() => s.setFiltersOpen(true)}
          onRemove={s.removeFilter}
          onResetAll={s.resetFilters}
          collaborators={s.collaborators}
        />
        {mode === 'page' && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={s.attachModeEnabled ? 'default' : 'outline'}
              size="sm"
              className="h-8"
              onClick={() => s.setAttachModeEnabled((v) => !v)}
              data-testid="toggle-attach-mode"
            >
              <Paperclip className="mr-1.5 h-3.5 w-3.5" />
              {s.attachModeEnabled ? 'Прикрепление вкл.' : 'Режим прикрепления'}
            </Button>
            {s.attachModeEnabled && attachTarget && (
              <span className="max-w-[12rem] truncate text-xs text-muted-foreground sm:max-w-xs">
                Цель: <strong className="text-foreground">{attachTarget.nodeLabel}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      <FiltersModal
        open={s.filtersOpen}
        value={s.filters}
        onApply={s.applyFilters}
        onReset={s.resetFilters}
        onOpenChange={s.setFiltersOpen}
        collaborators={s.collaborators}
      />

      {/* Таблица файлов: каркас + множественный выбор + адаптивность (Req 3.1, 7.1, 7.8, 13.3) */}
      <div className="min-h-0 flex-1 overflow-auto" data-testid="files-table-slot">
        <FilesTable
          files={s.files}
          projectId={projectId}
          selectedTokenId={selectedTokenId}
          selectedIds={s.selectedIds}
          onToggleSelect={s.toggleSelect}
          onSelectAll={s.selectAll}
          onCopyFileId={s.copyFileId}
          onDelete={s.deleteOne}
          collaborators={s.collaborators}
          allSheets={allSheets}
          onGoToNode={onGoToNode}
          isLoading={s.isLoading}
        />
      </div>

      {/* Плашка: в модалке всегда, на странице — при выборе или режиме прикрепления */}
      {(s.canAttach || s.selectedIds.size > 0) && (
        <SelectionActionBar
          selectedCount={s.selectedIds.size}
          canAttach={s.canAttach}
          onAttach={s.attachSelected}
          onDelete={s.deleteSelected}
          onClearSelection={s.clearSelection}
          isDeleting={s.isDeleting}
        />
      )}

      <FileStoragePagination
        page={s.page}
        totalPages={s.totalPages}
        total={s.total}
        onPageChange={(next) => s.setPage(next)}
      />
    </div>
  );
}
