/**
 * @fileoverview Хук для управления перетаскиванием листов между проектами
 * Предоставляет функции для начала перетаскивания и сброса листа на проект
 * @module components/editor/sidebar/hooks/use-sidebar-sheet-drag
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BotProject } from '@shared/schema';

/** Идентификатор листа */
export interface DraggedSheetInfo {
  /** Идентификатор листа */
  sheetId: string;
  /** Идентификатор проекта */
  projectId: number;
}

/**
 * Параметры хука useSidebarSheetDrag
 */
export interface UseSidebarSheetDragParams {
  /** Функция для обновления состояния перетаскиваемого листа */
  setDraggedSheet: (sheet: DraggedSheetInfo | null) => void;
  /** Функция для обновления состояния листа над которым курсор */
  setDragOverSheet: (sheetId: string | null) => void;
  /** Текущее состояние перетаскивания листов */
  sheetDragState: {
    /** Перетаскиваемый лист */
    draggedSheet: DraggedSheetInfo | null;
    /** Лист над которым находится курсор */
    dragOverSheet: string | null;
  };
  /** Список проектов для поиска исходного и целевого проекта */
  projects: BotProject[];
}

/**
 * Результат работы хука useSidebarSheetDrag
 */
export interface UseSidebarSheetDragResult {
  /** Обработчик начала перетаскивания листа */
  handleSheetDragStart: (e: React.DragEvent, sheetId: string, projectId: number) => void;
  /** Обработчик сброса листа на проект */
  handleSheetDropOnProject: (e: React.DragEvent, targetProjectId: number) => Promise<void>;
  /** Функция для очистки состояния перетаскивания */
  clearDraggedSheet: () => void;
}

/**
 * Хук для управления перетаскиванием листов между проектами
 * @param params - Параметры хука
 * @returns Объект с функциями управления перетаскиванием
 *
 * @example
 * ```tsx
 * const { handleSheetDragStart, handleSheetDropOnProject, clearDraggedSheet } = useSidebarSheetDrag({
 *   setDraggedSheet,
 *   setDragOverSheet,
 *   sheetDragState,
 *   projects
 * });
 * ```
 */
export function useSidebarSheetDrag({
  setDraggedSheet,
  setDragOverSheet,
  sheetDragState,
  projects,
}: UseSidebarSheetDragParams): UseSidebarSheetDragResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Обработчик начала перетаскивания листа
   * Инициализирует drag-and-drop для перемещения листов между проектами
   * @param e - Событие перетаскивания
   * @param sheetId - Идентификатор листа
   * @param projectId - Идентификатор проекта
   */
  const handleSheetDragStart = useCallback((e: React.DragEvent, sheetId: string, projectId: number) => {
    e.stopPropagation();
    setDraggedSheet({ sheetId, projectId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sheetId);
  }, [setDraggedSheet]);

  /**
   * Обработчик сброса листа на проект
   * Перемещает лист из одного проекта в другой
   * @param e - Событие сброса
   * @param targetProjectId - Идентификатор целевого проекта
   */
  const handleSheetDropOnProject = useCallback(async (e: React.DragEvent, targetProjectId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSheet(null);

    const draggedSheet = sheetDragState.draggedSheet;
    if (!draggedSheet) {
      return;
    }

    // Если перемещаем в свой же проект - отменяем
    if (draggedSheet.projectId === targetProjectId) {
      setDraggedSheet(null);
      return;
    }

    // Находим исходный и целевой проекты
    const sourceProject = projects.find(p => p.id === draggedSheet.projectId);
    const targetProject = projects.find(p => p.id === targetProjectId);

    if (!sourceProject || !targetProject) {
      setDraggedSheet(null);
      return;
    }

    try {
      const sourceData = sourceProject.data as any;
      const targetData = targetProject.data as any;

      // Проверяем что оба проекта в новом формате
      if (!sourceData?.sheets || !targetData?.sheets) {
        toast({
          title: "❌ Ошибка",
          description: "Оба проекта должны быть в новом формате с листами",
          variant: "destructive",
        });
        setDraggedSheet(null);
        return;
      }

      // Находим лист в исходном проекте
      const sourceSheetIndex = sourceData.sheets.findIndex((s: any) => s.id === draggedSheet.sheetId);
      if (sourceSheetIndex === -1) {
        setDraggedSheet(null);
        return;
      }

      const sheetToMove = sourceData.sheets[sourceSheetIndex];

      // Добавляем лист в целевой проект
      const newSheet = JSON.parse(JSON.stringify(sheetToMove)); // Deep copy
      targetData.sheets.push(newSheet);

      // Удаляем из исходного проекта
      sourceData.sheets.splice(sourceSheetIndex, 1);

      // Обновляем оба проекта на сервере
      await Promise.all([
        apiRequest('PUT', `/api/projects/${sourceProject.id}`, { data: sourceData }),
        apiRequest('PUT', `/api/projects/${targetProject.id}`, { data: targetData })
      ]);

      // Обновляем кеш
      const updatedProjects = projects.map(p => {
        if (p.id === sourceProject.id) return { ...p, data: sourceData };
        if (p.id === targetProject.id) return { ...p, data: targetData };
        return p;
      });
      queryClient.setQueryData(['/api/projects'], updatedProjects);

      toast({
        title: "✅ Лист перемещен",
        description: `"${sheetToMove.name}" перемещен в "${targetProject.name}"`,
      });
    } catch (error: any) {
      console.error('Ошибка при перемещении листа:', error);
      toast({
        title: "❌ Ошибка перемещения",
        description: error.message || "Не удалось переместить лист",
        variant: "destructive",
      });
    } finally {
      setDraggedSheet(null);
    }
  }, [sheetDragState.draggedSheet, projects, setDraggedSheet, setDragOverSheet, queryClient, toast]);

  /**
   * Функция для очистки состояния перетаскивания
   */
  const clearDraggedSheet = useCallback(() => {
    setDraggedSheet(null);
  }, [setDraggedSheet]);

  return {
    handleSheetDragStart,
    handleSheetDropOnProject,
    clearDraggedSheet,
  };
}
