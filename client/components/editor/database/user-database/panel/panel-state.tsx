/**
 * @fileoverview Стейт компонента UserDatabasePanel
 * @description Хуки useState для управления состоянием
 */

import { useState } from 'react';
import { SortField, SortDirection } from '../types';
import { UserDatabasePanelState, UserDatabasePanelSetters } from './panel-types';

/**
 * Результат хука useUserDatabasePanelState
 */
interface UseUserDatabasePanelStateReturn {
  /** Стейт компонента */
  state: UserDatabasePanelState;
  /** Сеттеры стейта */
  setters: UserDatabasePanelSetters;
}

/**
 * Хук для управления состоянием панели БД
 * @returns Объект со стейтом и сеттерами
 */
export function useUserDatabasePanelState(): UseUserDatabasePanelStateReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastInteraction');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterPremium, setFilterPremium] = useState<boolean | null>(null);

  return {
    state: {
      searchQuery,
      sortField,
      sortDirection,
      filterActive,
      filterPremium,
    },
    setters: {
      setSearchQuery,
      setSortField,
      setSortDirection,
      setFilterActive,
      setFilterPremium,
    },
  };
}
