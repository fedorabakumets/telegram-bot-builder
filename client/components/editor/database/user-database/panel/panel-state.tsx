/**
 * @fileoverview Стейт компонента UserDatabasePanel
 * @description Хуки useState для управления состоянием
 */

import { useState, useRef } from 'react';
import { UserBotData } from '@shared/schema';
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
  /** Ref для прокрутки сообщений */
  messagesScrollRef: React.RefObject<HTMLDivElement>;
}

/**
 * Хук для управления состоянием панели БД
 * @returns Объект со стейтом и сеттерами
 */
export function useUserDatabasePanelState(): UseUserDatabasePanelStateReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserBotData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [sortField, setSortField] = useState<SortField>('lastInteraction');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterPremium, setFilterPremium] = useState<boolean | null>(null);
  const [filterBlocked] = useState<boolean | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUserForDialog, setSelectedUserForDialog] = useState<UserBotData | null>(null);
  const [messageText, setMessageText] = useState('');

  const messagesScrollRef = useRef<HTMLDivElement>(null);

  return {
    state: {
      searchQuery,
      selectedUser,
      showUserDetails,
      sortField,
      sortDirection,
      filterActive,
      filterPremium,
      filterBlocked,
      showDialog,
      selectedUserForDialog,
      messageText,
    },
    setters: {
      setSearchQuery,
      setSelectedUser,
      setShowUserDetails,
      setSortField,
      setSortDirection,
      setFilterActive,
      setFilterPremium,
      setShowDialog,
      setSelectedUserForDialog,
      setMessageText,
    },
    messagesScrollRef,
  };
}
