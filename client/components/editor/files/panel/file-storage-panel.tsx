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
import { StorageQuotaBar } from './storage-quota-bar';
import { CategoryTabs } from './category-tabs';
import { FiltersRow } from './filters-row';
import { FiltersModal } from './filters-modal';
import { SelectionActionBar } from './selection-action-bar';
import { FilesTable } from './table/files-table';
import type { FileStoragePanelProps } from './panel-types';

/**
 * Панель файлового хранилища — общее ядро страницы и модалки.
 * @param props - Свойства панели (режим, проект, цель прикрепления, колбэки)
 * @returns JSX элемент панели
 */
export function FileStoragePanel(props: FileStoragePanelProps) {
  const { mode, attachTarget, projectId, selectedTokenId, onSelectToken, allProjects, onProjectChange, allSheets, onGoToNode } = props;
  const s = useFileStoragePanelState(props);

  /** Компактнее в модалке, полноэкранно на странице (Req 1.4) */
  const rootClassName =
    mode === 'modal'
      ? 'flex flex-col h-full max-h-[80vh] bg-background'
      : 'flex flex-col h-full bg-background';

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
      />

      <StorageQuotaBar
        usedBytes={s.quota.usedBytes}
        limitBytes={s.quota.limitBytes}
        isLoading={s.quota.isLoading}
      />

      {/* Категории-табы: Все / Входящие / Исходящие / Загруженные (Req 5.1, 5.6) */}
      <CategoryTabs category={s.category} onCategoryChange={s.setCategory} />

      {/* Кнопка фильтров + чипы активных фильтров над таблицей (Req 6.1, 6.8) */}
      <FiltersRow
        filters={s.filters}
        activeCount={s.activeFilterCount}
        onOpen={() => s.setFiltersOpen(true)}
        onRemove={s.removeFilter}
        onResetAll={s.resetFilters}
        collaborators={s.collaborators}
      />

      {/* Модалка фильтров: имя/дата/тип/сотрудник/хранилище/размер + валидация (Req 6.2–6.9) */}
      <FiltersModal
        open={s.filtersOpen}
        value={s.filters}
        onApply={s.applyFilters}
        onReset={s.resetFilters}
        onOpenChange={s.setFiltersOpen}
        collaborators={s.collaborators}
      />

      {/* Кнопка включения режима прикрепления доступна на странице ВСЕГДА (Req 3.7) */}
      {mode === 'page' && (
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <Button
            type="button"
            variant={s.attachModeEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => s.setAttachModeEnabled((v) => !v)}
            data-testid="toggle-attach-mode"
          >
            <Paperclip className="h-3.5 w-3.5 mr-1.5" />
            {s.attachModeEnabled ? 'Режим прикрепления включён' : 'Режим прикрепления'}
          </Button>
          {s.attachModeEnabled && attachTarget && (
            <span className="text-xs text-muted-foreground truncate">
              Цель: <strong>{attachTarget.nodeLabel}</strong>
            </span>
          )}
        </div>
      )}

      {/* Таблица файлов: каркас + множественный выбор + адаптивность (Req 3.1, 7.1, 7.8, 13.3) */}
      <div className="flex-1 overflow-auto" data-testid="files-table-slot">
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

      {/* Плашка массовых действий при выбранных файлах (Req 3.2–3.5) */}
      {s.selectedIds.size > 0 && (
        <SelectionActionBar
          selectedCount={s.selectedIds.size}
          canAttach={s.canAttach}
          onAttach={s.attachSelected}
          onDelete={s.deleteSelected}
          onClearSelection={s.clearSelection}
          isDeleting={s.isDeleting}
        />
      )}

      {/* Пагинация (минимальная; полноценные элементы управления — в дочерних задачах) */}
      {s.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
          <span>{s.total} файлов • стр. {s.page}/{s.totalPages}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" disabled={s.page <= 1} onClick={() => s.setPage((p) => p - 1)}>
              Назад
            </Button>
            <Button variant="ghost" size="sm" disabled={s.page >= s.totalPages} onClick={() => s.setPage((p) => p + 1)}>
              Вперёд
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
