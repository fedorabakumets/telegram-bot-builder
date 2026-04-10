/**
 * @fileoverview Хук управления панелями диалога и деталей пользователя
 * Инкапсулирует логику открытия/закрытия панелей пользовательской БД
 * @module pages/editor/hooks/use-dialog-panel
 */

import { useState, useCallback } from 'react';
import type { UserBotData } from '@shared/schema';
import type { SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';

/**
 * Параметры хука панелей диалога
 */
export interface UseDialogPanelOptions {
  /** Сеттер конфигурации гибкого макета */
  setFlexibleLayoutConfig: React.Dispatch<React.SetStateAction<SimpleLayoutConfig>>;
}

/**
 * Результат работы хука панелей диалога
 */
export interface UseDialogPanelResult {
  /** Выбранный пользователь для панели диалога */
  selectedDialogUser: UserBotData | null;
  /** Выбранный пользователь для панели деталей */
  selectedUserDetails: UserBotData | null;
  /** Закрыть панель диалога */
  handleCloseDialogPanel: () => void;
  /** Закрыть панель деталей пользователя */
  handleCloseUserDetailsPanel: () => void;
  /** Выбрать пользователя для диалога */
  handleSelectDialogUser: (user: UserBotData) => void;
  /** Выбрать пользователя для деталей */
  handleSelectUserDetails: (user: UserBotData) => void;
  /** Открыть/закрыть панель диалога (toggle) */
  handleOpenDialogPanel: (user: UserBotData) => void;
  /** Открыть/закрыть панель деталей (toggle) */
  handleOpenUserDetailsPanel: (user: UserBotData) => void;
}

/**
 * Хук для управления панелями диалога и деталей пользователя
 * @param options - Параметры хука
 * @returns Состояния и обработчики панелей
 */
export function useDialogPanel({ setFlexibleLayoutConfig }: UseDialogPanelOptions): UseDialogPanelResult {
  /** Выбранный пользователь для панели диалога */
  const [selectedDialogUser, setSelectedDialogUser] = useState<UserBotData | null>(null);
  /** Выбранный пользователь для панели деталей */
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserBotData | null>(null);

  /** Закрыть панель диалога */
  const handleCloseDialogPanel = useCallback(() => {
    setSelectedDialogUser(null);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === 'dialog' ? { ...el, visible: false } : el
      ),
    }));
  }, [setFlexibleLayoutConfig]);

  /** Закрыть панель деталей пользователя */
  const handleCloseUserDetailsPanel = useCallback(() => {
    setSelectedUserDetails(null);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id === 'userDetails') return { ...el, visible: false };
        if (el.id === 'sidebar') return { ...el, visible: true };
        return el;
      }),
    }));
  }, [setFlexibleLayoutConfig]);

  /** Выбрать пользователя для панели диалога */
  const handleSelectDialogUser = useCallback((user: UserBotData) => {
    setSelectedDialogUser(user);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id === 'dialog') return { ...el, visible: true };
        if (el.id === 'properties') return { ...el, visible: false };
        return el;
      }),
    }));
  }, [setFlexibleLayoutConfig]);

  /** Выбрать пользователя для панели деталей */
  const handleSelectUserDetails = useCallback((user: UserBotData) => {
    setSelectedUserDetails(user);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id === 'userDetails') return { ...el, visible: true };
        if (el.id === 'sidebar') return { ...el, visible: false };
        return el;
      }),
    }));
  }, [setFlexibleLayoutConfig]);

  /** Открыть/закрыть панель диалога (toggle) */
  const handleOpenDialogPanel = useCallback((user: UserBotData) => {
    if (selectedDialogUser?.userId === user.userId) {
      handleCloseDialogPanel();
    } else {
      handleSelectDialogUser(user);
    }
  }, [selectedDialogUser, handleSelectDialogUser, handleCloseDialogPanel]);

  /** Открыть/закрыть панель деталей (toggle) */
  const handleOpenUserDetailsPanel = useCallback((user: UserBotData) => {
    if (selectedUserDetails?.userId === user.userId) {
      handleCloseUserDetailsPanel();
    } else {
      handleSelectUserDetails(user);
    }
  }, [selectedUserDetails, handleSelectUserDetails, handleCloseUserDetailsPanel]);

  return {
    selectedDialogUser,
    selectedUserDetails,
    handleCloseDialogPanel,
    handleCloseUserDetailsPanel,
    handleSelectDialogUser,
    handleSelectUserDetails,
    handleOpenDialogPanel,
    handleOpenUserDetailsPanel,
  };
}
