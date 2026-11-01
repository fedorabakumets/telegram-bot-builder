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


import { FilePageSize } from './file-page-size';
import { Switch } from '@/components/ui/switch';

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
import { FilesListState } from './files-list-state';
import './files-page.css';

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
      : 'files-page flex min-h-0 h-full flex-col gap-3 overflow-auto bg-background p-4 sm:p-6';

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
        isRefreshing={s.isFetching}
      />

      <FileStorageToolbar
        category={s.category}
        onCategoryChange={s.setCategory}
        usedBytes={s.quota.usedBytes}
        limitBytes={s.quota.limitBytes}
        quotaLoading={s.quota.isLoading}
      />

      {/* Фильтры + режим прикрепления в одной строке */}
      <div className={mode === 'page' ? 'files-filter-actions flex shrink-0 flex-wrap items-center justify-between gap-3' : FILE_STORAGE_ACTIONS_ROW_CLASS}>
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
            <label className="files-attach-toggle inline-flex cursor-pointer items-center gap-3 text-sm font-medium">
              <span>Прикрепление к блоку</span>
              <Switch checked={s.attachModeEnabled} onCheckedChange={s.setAttachModeEnabled}
                aria-label="Прикрепление к блоку" data-testid="toggle-attach-mode" />
            </label>
            {s.attachModeEnabled && attachTarget && (
              <span className="max-w-[12rem] truncate text-xs text-muted-foreground sm:max-w-xs">
                Цель: <strong className="text-foreground">{attachTarget.nodeLabel}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      <FileAttachHint mode={mode} attachModeEnabled={s.attachModeEnabled} hasTarget={!!attachTarget} nodeLabel={attachTarget?.nodeLabel} onChooseNode={props.onChooseAttachNode} />

      <FiltersModal
        open={s.filtersOpen}
        value={s.filters}
        onApply={s.applyFilters}
        onReset={s.resetFilters}
        onOpenChange={s.setFiltersOpen}
        collaborators={s.collaborators}
      />

      {/* Таблица файлов: каркас + множественный выбор + адаптивность (Req 3.1, 7.1, 7.8, 13.3) */}
      <div className={mode === 'page' ? `files-surface files-content ${!s.files.length ? 'min-h-64' : 'min-h-48'} flex-1 overflow-auto rounded-xl border` : 'min-h-0 flex-1 overflow-auto'} data-testid="files-table-slot">
        {mode === 'page' && (s.isLoading || s.isError || !s.files.length) ? <FilesListState
          loading={s.isLoading} error={s.isError} filtered={s.category !== 'all' || s.activeFilterCount > 0 || selectedTokenId != null}
          canReset={s.activeFilterCount > 0} onRetry={s.refresh} onReset={s.resetFilters} /> : <FilesTable
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
          pageSizeControl={<FilePageSize value={s.pageSize} onChange={s.setPageSize} />}
          isLoading={s.isLoading}
        />}
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
        pageSize={s.pageSize}
        onPageSizeChange={s.setPageSize}
        page={s.page}
        totalPages={s.totalPages}
        total={s.total}
        onPageChange={(next) => s.setPage(next)}
      />
    </div>
  );
}
