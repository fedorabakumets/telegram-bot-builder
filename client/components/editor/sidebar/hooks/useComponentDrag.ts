/**
 * @fileoverview Hook для управления drag-and-drop проектов
 * Предоставляет обработчики для перетаскивания проектов в списке
 * @module components/editor/sidebar/hooks/useComponentDrag
 */

import { useState, useCallback } from 'react';
import { BotProject } from '@shared/schema';
import type { ProjectDragState, DraggedSheetInfo, SheetDragState } from '../types';
import {
  handleProjectDragStart,
  handleProjectDragOver,
  handleProjectDragLeave,
  handleProjectDrop,
} from '../handlers';

/**
 * Результат работы hook для drag-and-drop
 */
export interface UseComponentDragResult {
  /** Состояние drag-and-drop проектов */
  projectDragState: ProjectDragState;
  /** Состояние drag-and-drop листов */
  sheetDragState: SheetDragState;
  /** Обработчик начала перетаскивания проекта */
  onProjectDragStart: (e: React.DragEvent, project: BotProject) => void;
  /** Обработчик наведения на проект */
  onProjectDragOver: (e: React.DragEvent, projectId: number) => void;
  /** Обработчик ухода с проекта */
  onProjectDragLeave: () => void;
  /** Обработчик сброса проекта */
  onProjectDrop: (e: React.DragEvent, targetProject: BotProject) => void;
  /** Обработчик начала перетаскивания листа */
  onSheetDragStart: (e: React.DragEvent, sheetId: string, projectId: number) => void;
  /** Обработчик наведения на лист */
  onSheetDragOver: (e: React.DragEvent, sheetId: string) => void;
  /** Обработчик ухода с листа */
  onSheetDragLeave: () => void;
  /** Обработчик сброса листа */
  onSheetDrop: (e: React.DragEvent, targetSheetId: string) => void;
}

/**
 * Hook для управления drag-and-drop проектов и листов
 * @returns Объект с состояниями и обработчиками
 */
export function useComponentDrag(): UseComponentDragResult {
  // Состояние drag-and-drop проектов
  const [projectDragState, setProjectDragState] = useState<ProjectDragState>({
    draggedProject: null,
    dragOverProject: null,
  });

  // Состояние drag-and-drop листов
  const [sheetDragState, setSheetDragState] = useState<SheetDragState>({
    draggedSheet: null,
    dragOverSheet: null,
  });

  // Обработчик начала перетаскивания проекта
  const onProjectDragStart = useCallback((e: React.DragEvent, project: BotProject) => {
    setProjectDragState(prev => ({
      ...prev,
      draggedProject: project,
    }));
    handleProjectDragStart(e, {
      project,
      setDraggedSheet: (sheet) => setSheetDragState(prev => ({ ...prev, draggedSheet: sheet })),
      setDraggedProject: (proj) => setProjectDragState(prev => ({ ...prev, draggedProject: proj })),
    });
  }, []);

  // Обработчик наведения на проект
  const onProjectDragOver = useCallback((e: React.DragEvent, projectId: number) => {
    setProjectDragState(prev => ({
      ...prev,
      dragOverProject: projectId,
    }));
    handleProjectDragOver(e, projectId, (id) => setProjectDragState(prev => ({ ...prev, dragOverProject: id })));
  }, []);

  // Обработчик ухода с проекта
  const onProjectDragLeave = useCallback(() => {
    setProjectDragState(prev => ({
      ...prev,
      dragOverProject: null,
    }));
    handleProjectDragLeave((id) => setProjectDragState(prev => ({ ...prev, dragOverProject: id })));
  }, []);

  // Обработчик сброса проекта
  const onProjectDrop = useCallback((e: React.DragEvent, targetProject: BotProject) => {
    // Обработчик будет вызван с полным контекстом в компоненте
    handleProjectDragStart(e, {
      project: targetProject,
      setDraggedSheet: (sheet) => setSheetDragState(prev => ({ ...prev, draggedSheet: sheet })),
      setDraggedProject: (proj) => setProjectDragState(prev => ({ ...prev, draggedProject: proj })),
    });
  }, []);

  // Обработчик начала перетаскивания листа
  const onSheetDragStart = useCallback((e: React.DragEvent, sheetId: string, projectId: number) => {
    setSheetDragState({
      draggedSheet: { sheetId, projectId },
      dragOverSheet: null,
    });
  }, []);

  // Обработчик наведения на лист
  const onSheetDragOver = useCallback((e: React.DragEvent, sheetId: string) => {
    e.preventDefault();
    setSheetDragState(prev => ({
      ...prev,
      dragOverSheet: sheetId,
    }));
  }, []);

  // Обработчик ухода с листа
  const onSheetDragLeave = useCallback(() => {
    setSheetDragState(prev => ({
      ...prev,
      dragOverSheet: null,
    }));
  }, []);

  // Обработчик сброса листа
  const onSheetDrop = useCallback((e: React.DragEvent, targetSheetId: string) => {
    e.preventDefault();
    setSheetDragState({
      draggedSheet: null,
      dragOverSheet: null,
    });
    // Логика перемещения листа будет реализована в компоненте
  }, []);

  return {
    projectDragState,
    sheetDragState,
    onProjectDragStart,
    onProjectDragOver,
    onProjectDragLeave,
    onProjectDrop,
    onSheetDragStart,
    onSheetDragOver,
    onSheetDragLeave,
    onSheetDrop,
  };
}
