/**
 * @fileoverview Хук для управления состоянием импорта проекта
 * Управляет диалогом импорта и данными для импорта
 * @module components/editor/sidebar/hooks/use-sidebar-import
 */

import { useState, useCallback } from 'react';
import type { ImportState } from '../types';

/**
 * Результат работы хука импорта
 */
export interface UseSidebarImportResult {
  /** Состояние импорта */
  importState: ImportState;
  /** Открыть диалог импорта */
  openDialog: () => void;
  /** Закрыть диалог импорта */
  closeDialog: () => void;
  /** Установить JSON текст */
  setJsonText: (text: string) => void;
  /** Установить Python текст */
  setPythonText: (text: string) => void;
  /** Установить ошибку */
  setError: (error: string) => void;
  /** Очистить все данные импорта */
  clearImport: () => void;
}

/**
 * Хук для управления состоянием импорта проекта
 * @returns Объект с состоянием и методами управления импортом
 */
export function useSidebarImport(): UseSidebarImportResult {
  // Состояние импорта
  const [importState, setImportState] = useState<ImportState>({
    isOpen: false,
    jsonText: '',
    pythonText: '',
    error: '',
  });

  /**
   * Открыть диалог импорта
   */
  const openDialog = useCallback(() => {
    setImportState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  /**
   * Закрыть диалог импорта
   */
  const closeDialog = useCallback(() => {
    setImportState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Установить JSON текст
   * @param text - JSON текст
   */
  const setJsonText = useCallback((text: string) => {
    setImportState((prev) => ({ ...prev, jsonText: text }));
  }, []);

  /**
   * Установить Python текст
   * @param text - Python текст
   */
  const setPythonText = useCallback((text: string) => {
    setImportState((prev) => ({ ...prev, pythonText: text }));
  }, []);

  /**
   * Установить ошибку
   * @param error - Текст ошибки
   */
  const setError = useCallback((error: string) => {
    setImportState((prev) => ({ ...prev, error }));
  }, []);

  /**
   * Очистить все данные импорта
   */
  const clearImport = useCallback(() => {
    setImportState({
      isOpen: false,
      jsonText: '',
      pythonText: '',
      error: '',
    });
  }, []);

  return {
    importState,
    openDialog,
    closeDialog,
    setJsonText,
    setPythonText,
    setError,
    clearImport,
  };
}
