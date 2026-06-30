/**
 * @fileoverview Ряд фильтров над таблицей `FiltersRow` (Req 6.1, 6.8).
 * Композирует кнопку открытия модалки фильтров (`FiltersButton`) и чипы
 * активных фильтров (`ActiveFilterChips`) в одну строку. Вынесен из
 * FileStoragePanel, чтобы тело панели оставалось ≤150 строк.
 * @module components/editor/files/panel/filters-row
 */

import type { FileFilters } from '../hooks/project-files-query-params';
import type { CollaboratorInfo } from '../hooks/use-project-collaborators';
import { FiltersButton } from './filters-button';
import { ActiveFilterChips } from './active-filter-chips';
import type { FilterKey, StorageOption } from './active-filter-chips-labels';

/** Пропсы ряда фильтров */
export interface FiltersRowProps {
  /** Текущие фильтры */
  filters: FileFilters;
  /** Количество активных фильтров (бейдж на кнопке) */
  activeCount: number;
  /** Открыть модалку фильтров */
  onOpen: () => void;
  /** Снять один фильтр по его ключам */
  onRemove: (keys: FilterKey[]) => void;
  /** Сбросить все фильтры */
  onResetAll: () => void;
  /** Коллабораторы для подписи чипа «Сотрудник» */
  collaborators?: CollaboratorInfo[];
  /** Хранилища для подписи чипа «Хранилище» */
  storages?: StorageOption[];
}

/**
 * Строка с кнопкой фильтров и чипами активных фильтров над таблицей.
 * @param props - Фильтры, счётчик, колбэки и справочники подписей
 * @returns JSX элемент строки фильтров
 */
export function FiltersRow({
  filters,
  activeCount,
  onOpen,
  onRemove,
  onResetAll,
  collaborators,
  storages,
}: FiltersRowProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 px-4 py-2 border-b"
      data-testid="filters-row"
    >
      <FiltersButton activeCount={activeCount} onOpen={onOpen} />
      <ActiveFilterChips
        filters={filters}
        onRemove={onRemove}
        onResetAll={onResetAll}
        collaborators={collaborators}
        storages={storages}
      />
    </div>
  );
}
