/**
 * @fileoverview Хук обработчиков мобильных панелей
 *
 * Управляет открытием/закрытием мобильных панелей.
 *
 * @module UseMobileHandlers
 */

import { useCallback } from 'react';

/** Параметры хука useMobileHandlers */
export interface UseMobileHandlersParams {
  /** Установить видимость мобильного сайдбара */
  setShowMobileSidebar: (show: boolean) => void;
  /** Установить видимость мобильной панели свойств */
  setShowMobileProperties: (show: boolean) => void;
}

/** Результат работы хука useMobileHandlers */
export interface UseMobileHandlersResult {
  /** Открыть мобильный сайдбар */
  handleOpenMobileSidebar: () => void;
  /** Открыть мобильную панель свойств */
  handleOpenMobileProperties: () => void;
}

/**
 * Хук для управления мобильными панелями
 *
 * @param params - Параметры хука
 * @returns Объект с обработчиками
 */
export function useMobileHandlers(params: UseMobileHandlersParams): UseMobileHandlersResult {
  const { setShowMobileSidebar, setShowMobileProperties } = params;

  const handleOpenMobileSidebar = useCallback(() => {
    setShowMobileSidebar(true);
  }, [setShowMobileSidebar]);

  const handleOpenMobileProperties = useCallback(() => {
    setShowMobileProperties(true);
  }, [setShowMobileProperties]);

  return {
    handleOpenMobileSidebar,
    handleOpenMobileProperties,
  };
}
