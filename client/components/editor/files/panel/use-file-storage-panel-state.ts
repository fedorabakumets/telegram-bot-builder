/**
 * @fileoverview Хук-оркестратор состояния панели файлового хранилища.
 * Владеет состоянием категории, фильтров, выбора файлов, режима прикрепления
 * (для mode='page') и пагинации; подключает хуки данных (useProjectFiles,
 * useStorageQuota, useProjectCollaborators, useProjectTokens) и формирует
 * колбэки для дочерних компонентов. Логика вынесена сюда, чтобы тело
 * FileStoragePanel оставалось ≤150 строк (Req 1.6, 3.7).
 * @module components/editor/files/panel/use-file-storage-panel-state
 */

import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useProjectTokens } from '@/hooks/use-project-tokens';
import { useProjectFiles, type ProjectFile } from '../hooks/use-project-files';
import { useStorageQuota } from '../hooks/use-storage-quota';
import { useProjectCollaborators } from '../hooks/use-project-collaborators';
import type { FileCategory, FileFilters } from '../hooks/project-files-query-params';
import { useFileDeleteMutation } from './use-file-delete-mutation';
import { countActiveFilters, type FilterKey } from './active-filter-chips-labels';
import { buildSelectedRefs } from './attach-node-refs';
import type { FileStoragePanelProps } from './panel-types';

/** Размер страницы списка файлов */
const PAGE_SIZE = 50;

/**
 * Хук состояния и оркестрации панели хранилища.
 * @param props - Пропсы панели (режим, проект, цель прикрепления, колбэки)
 * @returns Состояние, данные хуков и обработчики для дочерних компонентов
 */
export function useFileStoragePanelState({ mode, projectId, selectedTokenId, attachTarget, onAttach, onClose }: FileStoragePanelProps) {
  const queryClient = useQueryClient();

  const [category, setCategoryRaw] = useState<FileCategory>('all');
  const [filters, setFilters] = useState<FileFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [attachModeEnabled, setAttachModeEnabled] = useState(false);

  // --- Данные ---
  const projectTokensInfo = useProjectTokens([projectId]);
  const tokens = projectTokensInfo[0]?.tokens ?? [];
  const { data: filesData, isLoading } = useProjectFiles({ projectId, category, filters, tokenId: selectedTokenId, page });
  const quota = useStorageQuota(projectId);
  const { collaborators } = useProjectCollaborators(projectId);

  const files = filesData?.files ?? [];
  const total = filesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /** Можно ли прикреплять: в модалке — при наличии цели, на странице — при включённом режиме */
  const canAttach = mode === 'modal' ? !!attachTarget : attachModeEnabled && !!attachTarget;

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const { deleteFiles, isDeleting } = useFileDeleteMutation(projectId, clearSelection);

  /** Смена категории сбрасывает страницу и выбор */
  const setCategory = useCallback((next: FileCategory) => {
    setCategoryRaw(next);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  /** Применение фильтров сбрасывает страницу */
  const applyFilters = useCallback((next: FileFilters) => {
    setFilters(next);
    setPage(1);
    setFiltersOpen(false);
  }, []);

  /** Сброс всех фильтров */
  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  /** Точечное снятие фильтра(ов) по ключам (чип «X», Req 6.8) */
  const removeFilter = useCallback((keys: FilterKey[]) => {
    setFilters((prev) => {
      const next = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });
    setPage(1);
  }, []);

  /** Количество применённых фильтров (бейдж на кнопке фильтров, Req 6.1) */
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  /** Переключение выбора одного файла */
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** Выбрать все на текущей странице / снять выбор */
  const selectAll = useCallback((flag: boolean) => setSelectedIds(flag ? new Set(files.map((f) => f.id)) : new Set()), [files]);

  /** Принудительное обновление списка файлов */
  const refresh = useCallback(() => { queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'files'] }); }, [queryClient, projectId]);

  /** Копирование file_id в буфер обмена */
  const copyFileId = useCallback((fileId: string) => { navigator.clipboard?.writeText(fileId); }, []);

  /** Массовое удаление выбранных файлов */
  const deleteSelected = useCallback(() => deleteFiles([...selectedIds], category), [deleteFiles, selectedIds, category]);

  /** Удаление одного файла (кнопка в строке таблицы, Req 3.6 / 7.1) */
  const deleteOne = useCallback((id: number) => deleteFiles([id], category), [deleteFiles, category]);

  /**
   * Прикрепление выбранных файлов: собирает дедуплицированные ссылки единого
   * формата (url либо JSON-запись file_id для file_id-only файлов, Req 8.4),
   * вызывает onAttach и закрывает модалку в mode='modal' (Req 3.4, 3.8).
   */
  const attachSelected = useCallback(() => {
    if (!onAttach) return;
    const selectedFiles = files.filter((f: ProjectFile) => selectedIds.has(f.id));
    const refs = buildSelectedRefs(selectedFiles, selectedTokenId);
    if (refs.length === 0) return;
    onAttach(refs);
    setSelectedIds(new Set());
    if (mode === 'modal') onClose?.();
  }, [files, selectedIds, selectedTokenId, onAttach, mode, onClose]);

  return useMemo(
    () => ({
      category, filters, filtersOpen, page, totalPages, selectedIds, attachModeEnabled, canAttach, activeFilterCount,
      tokens, files, total, isLoading, quota, collaborators,
      setCategory, setFiltersOpen, applyFilters, resetFilters, removeFilter,
      toggleSelect, selectAll, clearSelection, setAttachModeEnabled, setPage,
      refresh, copyFileId, deleteSelected, deleteOne, isDeleting, attachSelected,
    }),
    [category, filters, filtersOpen, page, totalPages, selectedIds, attachModeEnabled, canAttach, activeFilterCount,
      tokens, files, total, isLoading, quota, collaborators,
      setCategory, applyFilters, resetFilters, removeFilter, toggleSelect, selectAll, clearSelection,
      refresh, copyFileId, deleteSelected, deleteOne, isDeleting, attachSelected],
  );
}

/** Тип возвращаемого состояния панели (для типизации дочерних компонентов) */
export type FileStoragePanelState = ReturnType<typeof useFileStoragePanelState>;
