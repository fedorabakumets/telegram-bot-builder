/**
 * @fileoverview Хук для управления inline редактированием проекта
 * Управляет состоянием редактирования имени проекта
 * @module components/editor/sidebar/hooks/use-project-editing
 */

import { useState, useCallback } from 'react';

/**
 * Состояние редактирования проекта
 */
export interface EditingProjectState {
  /** ID редактируемого проекта */
  editingProjectId: number | null;
  /** Новое имя проекта */
  editingProjectName: string;
}

/**
 * Результат работы хука редактирования проекта
 */
export interface UseProjectEditingResult {
  /** Состояние редактирования */
  editingState: EditingProjectState;
  /** Начать редактирование проекта */
  startEditing: (projectId: number, currentName: string) => void;
  /** Сохранить имя проекта */
  saveEditing: () => { projectId: number | null; newName: string };
  /** Отменить редактирование */
  cancelEditing: () => void;
  /** Изменить имя в процессе редактирования */
  setEditingName: (name: string) => void;
}

/**
 * Хук для управления inline редактированием имени проекта
 * @returns Объект с состоянием и методами редактирования
 */
export function useProjectEditing(): UseProjectEditingResult {
  // Состояние редактирования
  const [editingState, setEditingState] = useState<EditingProjectState>({
    editingProjectId: null,
    editingProjectName: '',
  });

  /**
   * Начать редактирование проекта
   * @param projectId - ID редактируемого проекта
   * @param currentName - Текущее имя проекта
   */
  const startEditing = useCallback((projectId: number, currentName: string) => {
    setEditingState({
      editingProjectId: projectId,
      editingProjectName: currentName,
    });
  }, []);

  /**
   * Сохранить имя проекта
   * @returns Объект с ID проекта и новым именем
   */
  const saveEditing = useCallback(() => {
    const { editingProjectId, editingProjectName } = editingState;
    setEditingState({ editingProjectId: null, editingProjectName: '' });
    return { projectId: editingProjectId, newName: editingProjectName };
  }, [editingState]);

  /**
   * Отменить редактирование
   */
  const cancelEditing = useCallback(() => {
    setEditingState({ editingProjectId: null, editingProjectName: '' });
  }, []);

  /**
   * Изменить имя в процессе редактирования
   * @param name - Новое имя проекта
   */
  const setEditingName = useCallback((name: string) => {
    setEditingState((prev) => ({ ...prev, editingProjectName: name }));
  }, []);

  return {
    editingState,
    startEditing,
    saveEditing,
    cancelEditing,
    setEditingName,
  };
}
