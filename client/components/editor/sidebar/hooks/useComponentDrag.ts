/**
 * @fileoverview Hook для управления drag-and-drop проектов
 * Предоставляет обработчики для перетаскивания проектов в списке
 * @module components/editor/sidebar/hooks/useComponentDrag
 */

import { useState, useCallback, useEffect } from 'react';
import { BotProject } from '@shared/schema';
import type { ProjectDragState, DraggedSheetInfo, SheetDragState } from '../types';
import {
  handleProjectDragStart,
  handleProjectDragOver,
  handleProjectDragLeave,
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

  // Деструктуризация setState функций для передачи в обработчики
  const [draggedProject, setDraggedProject] = useState<BotProject | null>(null);
  const [dragOverProject, setDragOverProject] = useState<number | null>(null);
  const [draggedSheet, setDraggedSheet] = useState<DraggedSheetInfo | null>(null);
  const [dragOverSheet, setDragOverSheet] = useState<string | null>(null);

  // Синхронизация состояний
  useEffect(() => {
    setProjectDragState({ draggedProject, dragOverProject });
  }, [draggedProject, dragOverProject]);

  useEffect(() => {
    setSheetDragState({ draggedSheet, dragOverSheet });
  }, [draggedSheet, dragOverSheet]);

  // Обработчик начала перетаскивания проекта
  const onProjectDragStart = useCallback((e: React.DragEvent, project: BotProject) => {
    setProjectDragState({
      draggedProject: project,
      dragOverProject: null,
    });
    handleProjectDragStart(e, {
      project,
      setDraggedSheet,
      setDraggedProject,
    });
  }, []);

  // Обработчик наведения на проект
  const onProjectDragOver = useCallback((e: React.DragEvent, projectId: number) => {
    handleProjectDragOver(e, projectId, setDragOverProject);
  }, []);

  // Обработчик ухода с проекта
  const onProjectDragLeave = useCallback(() => {
    handleProjectDragLeave(setDragOverProject);
  }, []);

  // Обработчик сброса проекта
  // Примечание: требует полной реализации с использованием handleProjectDrop
  // В текущей версии используется в компонентах напрямую
  const onProjectDrop = useCallback((_e: React.DragEvent, _targetProject: BotProject) => {
    // Обработчик будет вызван с полным контекстом в компоненте
    // Требуется передача queryClient, toast и других зависимостей
  }, []);

  // Обработчик начала перетаскивания листа
  const onSheetDragStart = useCallback((e: React.DragEvent, sheetId: string, projectId: number) => {
    e.stopPropagation();
    setDraggedSheet({ sheetId, projectId });
  }, []);

  // Обработчик наведения на лист
  const onSheetDragOver = useCallback((e: React.DragEvent, sheetId: string) => {
    e.preventDefault();
    setDragOverSheet(sheetId);
  }, []);

  // Обработчик ухода с листа
  const onSheetDragLeave = useCallback(() => {
    setDragOverSheet(null);
  }, []);

  // Обработчик сброса листа
  const onSheetDrop = useCallback((e: React.DragEvent, _targetSheetId: string) => {
    e.preventDefault();
    setDraggedSheet(null);
    setDragOverSheet(null);
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
