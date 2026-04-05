/**
 * @fileoverview Хук состояний UI редактора
 *
 * Управляет состояниями модальных окон и панелей.
 *
 * @module UseEditorUIStates
 */

import { useState } from 'react';

/** Результат работы хука useEditorUIStates */
export interface UseEditorUIStatesResult {
  /** Флаг загрузки сценария */
  isLoadingTemplate: boolean;
  /** Флаг отображения менеджера макета */
  showLayoutManager: boolean;
  /** Флаг отображения мобильной панели свойств */
  showMobileProperties: boolean;
  /** Флаг отображения мобильного сайдбара */
  showMobileSidebar: boolean;
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
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return {
    isLoadingTemplate,
    showLayoutManager,
    showMobileProperties,
    showMobileSidebar,
    setIsLoadingTemplate,
    setShowLayoutManager,
    setShowMobileProperties,
    setShowMobileSidebar,
  };
}
