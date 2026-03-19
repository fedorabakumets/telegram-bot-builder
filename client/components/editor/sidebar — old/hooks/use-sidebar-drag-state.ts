/**
 * @fileoverview Хук для управления состоянием drag-and-drop в сайдбаре
 * Управляет перетаскиванием проектов и листов между проектами
 * @module components/editor/sidebar/hooks/use-sidebar-drag-state
 */

import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { BotProject } from '@shared/schema';

/**
 * Информация о перетаскиваемом листе
 */
export interface DraggedSheetInfo {
  /** Идентификатор листа */
  sheetId: string;
  /** Идентификатор проекта */
  projectId: number;
}

/**
 * Состояние drag-and-drop для проектов
 */
export interface ProjectDragState {
  /** Перетаскиваемый проект */
  draggedProject: BotProject | null;
  /** ID проекта, над которым находится курсор */
  dragOverProject: number | null;
}

/**
 * Состояние drag-and-drop для листов
 */
export interface SheetDragState {
  /** Перетаскиваемый лист */
  draggedSheet: DraggedSheetInfo | null;
  /** ID листа, над которым находится курсор */
  dragOverSheet: string | null;
}

/**
 * Результат работы хука drag-and-drop
 */
export interface UseSidebarDragStateResult {
  /** Состояние drag-and-drop проектов */
  projectDragState: ProjectDragState;
  /** Состояние drag-and-drop листов */
  sheetDragState: SheetDragState;
  /** Установить перетаскиваемый проект */
  setDraggedProject: React.Dispatch<React.SetStateAction<BotProject | null>>;
  /** Установить проект над которым курсор */
  setDragOverProject: React.Dispatch<React.SetStateAction<number | null>>;
  /** Установить перетаскиваемый лист */
  setDraggedSheet: React.Dispatch<React.SetStateAction<DraggedSheetInfo | null>>;
  /** Установить лист над которым курсор */
  setDragOverSheet: React.Dispatch<React.SetStateAction<string | null>>;
  /** Сбросить все состояния drag-and-drop */
  resetDragState: () => void;
}

/**
 * Хук для управления состоянием drag-and-drop
 * @returns Объект с состояниями и методами управления
 */
export function useSidebarDragState(): UseSidebarDragStateResult {
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

  /**
   * Установить перетаскиваемый проект
   */
  const setDraggedProject = useCallback<Dispatch<SetStateAction<BotProject | null>>>((value) => {
    setProjectDragState((prev) => ({ ...prev, draggedProject: typeof value === 'function' ? value(prev.draggedProject) : value }));
  }, []);

  /**
   * Установить проект над которым находится курсор
   */
  const setDragOverProject = useCallback<Dispatch<SetStateAction<number | null>>>((value) => {
    setProjectDragState((prev) => ({ ...prev, dragOverProject: typeof value === 'function' ? value(prev.dragOverProject) : value }));
  }, []);

  /**
   * Установить перетаскиваемый лист
   */
  const setDraggedSheet = useCallback<Dispatch<SetStateAction<DraggedSheetInfo | null>>>((value) => {
    setSheetDragState((prev) => ({ ...prev, draggedSheet: typeof value === 'function' ? value(prev.draggedSheet) : value }));
  }, []);

  /**
   * Установить лист над которым находится курсор
   */
  const setDragOverSheet = useCallback<Dispatch<SetStateAction<string | null>>>((value) => {
    setSheetDragState((prev) => ({ ...prev, dragOverSheet: typeof value === 'function' ? value(prev.dragOverSheet) : value }));
  }, []);

  /**
   * Сбросить все состояния drag-and-drop
   */
  const resetDragState = useCallback(() => {
    setProjectDragState({ draggedProject: null, dragOverProject: null });
    setSheetDragState({ draggedSheet: null, dragOverSheet: null });
  }, []);

  return {
    projectDragState,
    sheetDragState,
    setDraggedProject,
    setDragOverProject,
    setDraggedSheet,
    setDragOverSheet,
    resetDragState,
  };
}
