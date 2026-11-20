/**
 * @fileoverview Компонент секции фильтров
 * @description Отображает поиск и фильтры пользователей
 */

import { FiltersContainer } from '../components/filters';
import { DatabaseContentProps } from './database-content-props';
import { SourceFilter } from '../components/filters/source-filter';
import { AdvancedUsersFilter } from '../components/filters/advanced-users-filter';

/**
 * Пропсы компонента DatabaseFiltersSection
 */
type DatabaseFiltersSectionProps = Pick<
  DatabaseContentProps,
  | 'projectId'
  | 'selectedTokenId'
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
      advancedControl={<AdvancedUsersFilter projectId={props.projectId} tokenId={props.selectedTokenId} search={searchQuery} />}
      sourceControl={<SourceFilter projectId={props.projectId} tokenId={props.selectedTokenId} />}
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
