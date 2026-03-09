/**
 * @fileoverview Хук состояний UI редактора
 *
 * Управляет состояниями модальных окон и панелей.
 *
 * @module UseEditorUIStates
 */

import { useState } from 'react';
import type { UserBotData } from '@shared/schema';

/** Результат работы хука useEditorUIStates */
export interface UseEditorUIStatesResult {
  /** Выбранный пользователь для диалога */
  selectedDialogUser: UserBotData | null;
  /** Выбранный пользователь для деталей */
  selectedUserDetails: UserBotData | null;
  /** Флаг загрузки шаблона */
  isLoadingTemplate: boolean;
  /** Флаг отображения менеджера макета */
  showLayoutManager: boolean;
  /** Флаг отображения мобильной панели свойств */
  showMobileProperties: boolean;
  /** Флаг отображения мобильного сайдбара */
  showMobileSidebar: boolean;
  /** Установить selectedDialogUser */
  setSelectedDialogUser: (user: UserBotData | null) => void;
  /** Установить selectedUserDetails */
  setSelectedUserDetails: (user: UserBotData | null) => void;
  /** Установить isLoadingTemplate */
  setIsLoadingTemplate: (loading: boolean) => void;
  /** Установить showLayoutManager */
  setShowLayoutManager: (show: boolean) => void;
  /** Установить showMobileProperties */
  setShowMobileProperties: (show: boolean) => void;
  /** Установить showMobileSidebar */
  setShowMobileSidebar: (show: boolean) => void;
}

/**
 * Хук для управления состояниями UI редактора
 *
 * @returns Объект с состояниями и сеттерами
 */
export function useEditorUIStates(): UseEditorUIStatesResult {
  const [selectedDialogUser, setSelectedDialogUser] = useState<UserBotData | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserBotData | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return {
    selectedDialogUser,
    selectedUserDetails,
    isLoadingTemplate,
    showLayoutManager,
    showMobileProperties,
    showMobileSidebar,
    setSelectedDialogUser,
    setSelectedUserDetails,
    setIsLoadingTemplate,
    setShowLayoutManager,
    setShowMobileProperties,
    setShowMobileSidebar,
  };
}
