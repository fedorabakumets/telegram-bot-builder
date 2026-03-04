/**
 * @fileoverview Хук обработчиков переключения кодовых панелей
 *
 * Управляет видимостью панелей кода.
 *
 * @module UseCodePanelHandlers
 */

import { useCallback } from 'react';
import type { SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';

/** Параметры хука useCodePanelHandlers */
export interface UseCodePanelHandlersParams {
  /** Установить видимость панели кода */
  setCodePanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
  /** Установить видимость редактора кода */
  setCodeEditorVisible: React.Dispatch<React.SetStateAction<boolean>>;
  /** Текущая вкладка */
  currentTab: string;
  /** Установить конфигурацию макета */
  setFlexibleLayoutConfig: React.Dispatch<React.SetStateAction<SimpleLayoutConfig>>;
  /** Видимость редактора кода */
  codeEditorVisible: boolean;
}

/** Результат работы хука useCodePanelHandlers */
export interface UseCodePanelHandlersResult {
  /** Переключить видимость CodePanel */
  handleToggleCodePanel: () => void;
  /** Открыть панель кода */
  handleOpenCodePanel: () => void;
  /** Закрыть панель кода */
  handleCloseCodePanel: () => void;
  /** Переключить видимость редактора кода */
  handleToggleCodeEditor: () => void;
}

/**
 * Хук для управления переключением кодовых панелей
 *
 * @param params - Параметры хука
 * @returns Объект с обработчиками
 */
export function useCodePanelHandlers(params: UseCodePanelHandlersParams): UseCodePanelHandlersResult {
  const {
    setCodePanelVisible,
    setCodeEditorVisible,
    currentTab,
    setFlexibleLayoutConfig,
    codeEditorVisible,
  } = params;

  const handleToggleCodePanel = useCallback(() => {
    setCodePanelVisible(prev => !prev);
  }, [setCodePanelVisible]);

  const handleOpenCodePanel = useCallback(() => {
    setCodePanelVisible(true);
    setCodeEditorVisible(true);
    // Обновляем конфигурацию макета для видимости элементов code и codeEditor
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element => {
        if (element.id === 'code' || element.id === 'codeEditor') {
          return { ...element, visible: true };
        }
        return element;
      })
    }));
  }, [setCodePanelVisible, setCodeEditorVisible, setFlexibleLayoutConfig]);

  const handleCloseCodePanel = useCallback(() => {
    setCodePanelVisible(false);
    setCodeEditorVisible(false);
    // Обновляем конфигурацию макета для скрытия элементов code и codeEditor
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element => {
        if (element.id === 'code' || element.id === 'codeEditor') {
          return { ...element, visible: false };
        }
        return element;
      })
    }));
  }, [setCodePanelVisible, setCodeEditorVisible, setFlexibleLayoutConfig]);

  const handleToggleCodeEditor = useCallback(() => {
    const isVisible = !codeEditorVisible;
    setCodeEditorVisible(isVisible);
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element => {
        if (element.id === 'codeEditor') {
          return { ...element, visible: isVisible };
        }
        return { ...element, visible: element.visible ?? true };
      })
    }));
  }, [codeEditorVisible, setCodeEditorVisible, setFlexibleLayoutConfig]);

  return {
    handleToggleCodePanel,
    handleOpenCodePanel,
    handleCloseCodePanel,
    handleToggleCodeEditor,
  };
}
