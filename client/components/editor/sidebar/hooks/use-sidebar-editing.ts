/**
 * @fileoverview Хук для управления inline редактированием листов
 * Управляет состоянием редактирования имени листа
 * @module components/editor/sidebar/hooks/use-sidebar-editing
 */

import { useState, useCallback } from 'react';
import type { EditingSheetState } from '../types';

/**
 * Результат работы хука редактирования
 */
export interface UseSidebarEditingResult {
  /** Состояние редактирования */
  editingState: EditingSheetState;
  /** Начать редактирование листа */
  startEditing: (sheetId: string, currentName: string) => void;
  /** Сохранить имя листа */
  saveEditing: () => { sheetId: string | null; newName: string };
  /** Отменить редактирование */
  cancelEditing: () => void;
  /** Изменить имя в процессе редактирования */
  setEditingName: (name: string) => void;
}

/**
 * Хук для управления inline редактированием листов
 * @returns Объект с состоянием и методами редактирования
 */
export function useSidebarEditing(): UseSidebarEditingResult {
  // Состояние редактирования
  const [editingState, setEditingState] = useState<EditingSheetState>({
    editingSheetId: null,
    editingSheetName: '',
  });

  /**
   * Начать редактирование листа
   * @param sheetId - ID редактируемого листа
   * @param currentName - Текущее имя листа
   */
  const startEditing = useCallback((sheetId: string, currentName: string) => {
    setEditingState({
      editingSheetId: sheetId,
      editingSheetName: currentName,
    });
  }, []);

  /**
   * Сохранить имя листа
   * @returns Объект с ID листа и новым именем
   */
  const saveEditing = useCallback(() => {
    const { editingSheetId, editingSheetName } = editingState;
    setEditingState({ editingSheetId: null, editingSheetName: '' });
    return { sheetId: editingSheetId, newName: editingSheetName };
  }, [editingState]);

  /**
   * Отменить редактирование
   */
  const cancelEditing = useCallback(() => {
    setEditingState({ editingSheetId: null, editingSheetName: '' });
  }, []);

  /**
   * Изменить имя в процессе редактирования
   * @param name - Новое имя листа
   */
  const setEditingName = useCallback((name: string) => {
    setEditingState((prev) => ({ ...prev, editingSheetName: name }));
  }, []);

  return {
    editingState,
    startEditing,
    saveEditing,
    cancelEditing,
    setEditingName,
  };
}
