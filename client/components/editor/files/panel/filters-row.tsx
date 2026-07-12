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
import { PANEL_SECTION_CLASS } from './panel-styles';
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
  /** Встроенный режим — без отдельной секции с border-b */
  embedded?: boolean;
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
  embedded = false,
}: FiltersRowProps) {
  return (
    <div
      className={
        embedded
          ? 'flex min-w-0 flex-1 flex-wrap items-center gap-2'
          : `flex flex-wrap items-center gap-2 ${PANEL_SECTION_CLASS}`
      }
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
