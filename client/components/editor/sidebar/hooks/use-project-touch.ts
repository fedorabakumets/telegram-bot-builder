/**
 * @fileoverview Хук для touch-перетаскивания проектов
 * Предоставляет обработчики touch-событий для drag-and-drop проектов на мобильных устройствах
 */

import { BotProject } from '@shared/schema';
import { useState, useCallback } from 'react';

/** Параметры хука useProjectTouch */
export interface UseProjectTouchParams {
  /** Проект для перетаскивания */
  project: BotProject;
  /** Колбэк начала перетаскивания проекта */
  onDragStart?: () => void;
  /** Колбэк окончания перетаскивания проекта */
  onDragEnd?: () => void;
}

/** Результат хука useProjectTouch */
export interface UseProjectTouchResult {
  /** Обработчик начала касания */
  handleTouchStart: (e: React.TouchEvent) => void;
  /** Обработчик движения касания */
  handleTouchMove: (e: React.TouchEvent) => void;
  /** Обработчик окончания касания */
  handleTouchEnd: (e: React.TouchEvent) => void;
  /** Флаг активного перетаскивания */
  isDragging: boolean;
}

/**
 * Хук для управления touch-перетаскиванием проектов
 * @param params - Параметры хука
 * @returns Объект с обработчиками и состоянием
 */
export function useProjectTouch({
  project,
  onDragStart,
  onDragEnd,
}: UseProjectTouchParams): UseProjectTouchResult {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  /** Обработчик начала касания */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
    onDragStart?.();
  }, [onDragStart]);

  /** Обработчик движения касания */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const diffX = touch.clientX - startPos.x;
    const diffY = touch.clientY - startPos.y;
    
    // Перемещаем элемент визуально
    const target = e.currentTarget as HTMLElement;
    target.style.transform = `translate(${diffX}px, ${diffY}px)`;
    target.style.opacity = '0.5';
  }, [isDragging, startPos]);

  /** Обработчик окончания касания */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.changedTouches[0];
    const target = e.currentTarget as HTMLElement;
    
    // Сбрасываем стили
    target.style.transform = '';
    target.style.opacity = '';
    
    // Определяем элемент под пальцем
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = element?.closest('[data-project-id]');
    
    if (dropTarget) {
      const targetProjectId = Number(dropTarget.getAttribute('data-project-id'));
      if (targetProjectId && targetProjectId !== project.id) {
        // Эмитим событие для обработки в родительском компоненте
        const dropEvent = new CustomEvent('project-drop', {
          detail: {
            draggedProjectId: project.id,
            targetProjectId,
          },
          bubbles: true,
        });
        dropTarget.dispatchEvent(dropEvent);
      }
    }
    
    setIsDragging(false);
    onDragEnd?.();
  }, [isDragging, project.id, onDragEnd]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging,
  };
}
