/**
 * @fileoverview Контейнер для поискового ввода и фильтров
 * @description Объединяет поиск и фильтры в единую панель
 */

import { SearchInput } from './search-input';
import { StatusFilter } from './status-filter';
import { PremiumFilter } from './premium-filter';
import { SortFilter } from './sort-filter';
import { SortField, SortDirection } from '../../types';

/**
 * Пропсы компонента FiltersContainer
 */
interface FiltersContainerProps {
  /** Поисковый запрос */
  searchQuery: string;
  /** Функция изменения запроса */
  setSearchQuery: (value: string) => void;
  /** Значение фильтра по статусу */
  filterActive: string;
  /** Функция изменения статуса */
  setFilterActive: (value: string) => void;
  /** Значение фильтра по Premium */
  filterPremium: string;
  /** Функция изменения Premium */
  setFilterPremium: (value: string) => void;
  /** Поле сортировки */
  sortField: SortField;
  /** Направление сортировки */
  sortDirection: SortDirection;
  /** Функция изменения сортировки */
  setSort: (field: SortField, direction: SortDirection) => void;
}

/**
 * Компонент контейнера фильтров
 * @param props - Пропсы компонента
 * @returns JSX компонент контейнера
 */
export function FiltersContainer(props: FiltersContainerProps): React.JSX.Element {
  const {
    searchQuery,
    setSearchQuery,
    filterActive,
    setFilterActive,
    filterPremium,
    setFilterPremium,
    sortField,
    sortDirection,
    setSort,
  } = props;

  return (
    <div className="bg-muted/30 dark:bg-muted/10 rounded-xl p-3 sm:p-4 mx-3 sm:mx-4 space-y-3">
      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <StatusFilter value={filterActive} onChange={setFilterActive} />
        <PremiumFilter value={filterPremium} onChange={setFilterPremium} />
        <SortFilter
          sortField={sortField}
          sortDirection={sortDirection}
          onChange={setSort}
        />
      </div>
    </div>
  );
}
