/**
 * @fileoverview Хук обработчиков диалоговых панелей
 *
 * Управляет открытием/закрытием панелей диалогов и деталей пользователей.
 *
 * @module UseDialogHandlers
 */

import { useCallback, useState, useEffect } from 'react';
import type { UserBotData } from '@shared/schema';
import type { SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';

/** Параметры хука useDialogHandlers */
export interface UseDialogHandlersParams {
  /** Функция обновления конфигурации макета */
  setFlexibleLayoutConfig: React.Dispatch<React.SetStateAction<SimpleLayoutConfig>>;
}

/** Результат работы хука useDialogHandlers */
export interface UseDialogHandlersResult {
  /** Выбранный пользователь для диалога */
  selectedDialogUser: UserBotData | null;
  /** Выбранный пользователь для деталей */
  selectedUserDetails: UserBotData | null;
  /** Открыть панель диалога */
  handleOpenDialogPanel: (user: UserBotData) => void;
  /** Закрыть панель диалога */
  handleCloseDialogPanel: () => void;
  /** Открыть панель деталей */
  handleOpenUserDetailsPanel: (user: UserBotData) => void;
  /** Закрыть панель деталей */
  handleCloseUserDetailsPanel: () => void;
  /** Установить выбранного пользователя для деталей */
  setSelectedUserDetails: (user: UserBotData | null) => void;
}

/**
 * Хук для управления диалоговыми панелями
 *
 * @param params - Параметры хука
 * @returns Объект с обработчиками
 */
export function useDialogHandlers(params: UseDialogHandlersParams): UseDialogHandlersResult {
  const { setFlexibleLayoutConfig } = params;
  const [selectedDialogUser, setSelectedDialogUser] = useState<UserBotData | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserBotData | null>(null);

  const handleOpenDialogPanel = useCallback((user: UserBotData) => {
    const isAlreadyOpen = selectedDialogUser?.id === user.id;
    if (isAlreadyOpen) {
      setSelectedDialogUser(null);
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(el => 
          el.id === 'dialog' ? { ...el, visible: false } : el
        )
      }));
    } else {
      setSelectedDialogUser(user);
      setFlexibleLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(el => {
          if (el.id === 'dialog') return { ...el, visible: true };
          if (el.id === 'properties') return { ...el, visible: false };
          return el;
        })
      }));
    }
  }, [selectedDialogUser, setFlexibleLayoutConfig]);

  const handleCloseDialogPanel = useCallback(() => {
    setSelectedDialogUser(null);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el =>
        el.id === 'dialog' ? { ...el, visible: false } : el
      )
    }));
  }, [setFlexibleLayoutConfig]);

  const handleOpenUserDetailsPanel = useCallback((user: UserBotData) => {
    // Обновляем выбранного пользователя и показываем панель
    setSelectedUserDetails(user);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id === 'userDetails') return { ...el, visible: true };
        if (el.id === 'sidebar') return { ...el, visible: false };
        return el;
      })
    }));
  }, [setFlexibleLayoutConfig]);

  const handleCloseUserDetailsPanel = useCallback(() => {
    setSelectedUserDetails(null);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => {
        if (el.id === 'userDetails') return { ...el, visible: false };
        if (el.id === 'sidebar') return { ...el, visible: true };
        return el;
      })
    }));
  }, [setFlexibleLayoutConfig]);

  return {
    selectedDialogUser,
    selectedUserDetails,
    handleOpenDialogPanel,
    handleCloseDialogPanel,
    handleOpenUserDetailsPanel,
    handleCloseUserDetailsPanel,
    setSelectedUserDetails,
  };
}
