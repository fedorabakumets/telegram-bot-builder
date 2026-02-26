/**
 * @fileoverview Компонент секции фильтров
 * @description Отображает поиск и фильтры пользователей
 */

import { FiltersContainer } from '../components/filters';
import { DatabaseContentProps } from './database-content-props';

/**
 * Пропсы компонента DatabaseFiltersSection
 */
type DatabaseFiltersSectionProps = Pick<
  DatabaseContentProps,
  | 'searchQuery'
  | 'setSearchQuery'
  | 'filterActive'
  | 'setFilterActive'
  | 'filterPremium'
  | 'setFilterPremium'
  | 'sortField'
  | 'sortDirection'
  | 'setSortField'
  | 'setSortDirection'
>;

/**
 * Компонент секции фильтров
 * @param props - Пропсы компонента
 * @returns JSX компонент фильтров
 */
export function DatabaseFiltersSection(props: DatabaseFiltersSectionProps): React.JSX.Element | null {
  const {
    searchQuery,
    setSearchQuery,
    filterActive,
    setFilterActive,
    filterPremium,
    setFilterPremium,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
  } = props;

  return (
    <FiltersContainer
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      filterActive={filterActive?.toString() || 'all'}
      setFilterActive={(value) => setFilterActive(value === 'all' ? null : value === 'true')}
      filterPremium={filterPremium?.toString() || 'all'}
      setFilterPremium={(value) => setFilterPremium(value === 'all' ? null : value === 'true')}
      sortField={sortField}
      sortDirection={sortDirection}
      setSort={(field, direction) => {
        setSortField(field);
        setSortDirection(direction);
      }}
    />
  );
}
