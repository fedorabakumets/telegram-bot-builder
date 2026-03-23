/**
 * @fileoverview Хук для управления touch-состоянием на мобильных устройствах
 * Управляет перетаскиванием компонентов через touch-события
 * @module components/editor/sidebar/hooks/use-sidebar-touch
 */

import { useState, useCallback } from 'react';
import { ComponentDefinition } from '@shared/schema';

/**
 * Состояние touch-перетаскивания
 */
export interface TouchDragState {
  /** Компонент, который перетаскивают */
  touchedComponent: ComponentDefinition | null;
  /** Идёт ли перетаскивание */
  isDragging: boolean;
  /** Элемент, с которого началось перетаскивание */
  touchStartElement: HTMLElement | null;
}

/**
 * Результат работы хука touch-перетаскивания
 */
export interface UseSidebarTouchResult {
  /** Состояние touch-перетаскивания */
  touchState: TouchDragState;
  /** Начать touch-перетаскивание */
  startTouch: (component: ComponentDefinition, element: HTMLElement) => void;
  /** Завершить touch-перетаскивание */
  endTouch: () => void;
  /** Обновить позицию при перетаскивании */
  updateTouchPosition: (x: number, y: number) => void;
  /** Проверить, идёт ли перетаскивание */
  isDraggingComponent: (componentId: string) => boolean;
}

/**
 * Хук для управления touch-перетаскиванием компонентов
 * @returns Объект с состоянием и методами управления
 */
export function useSidebarTouch(): UseSidebarTouchResult {
  // Состояние touch-перетаскивания
  const [touchState, setTouchState] = useState<TouchDragState>({
    touchedComponent: null,
    isDragging: false,
    touchStartElement: null,
  });

  /**
   * Начать touch-перетаскивание
   * @param component - Компонент для перетаскивания
   * @param element - DOM-элемент, с которого началось перетаскивание
   */
  const startTouch = useCallback(
    (component: ComponentDefinition, element: HTMLElement) => {
      setTouchState({
        touchedComponent: component,
        isDragging: true,
        touchStartElement: element,
      });

      // Добавляем визуальную обратную связь
      element.style.opacity = '0.7';
      element.style.transform = 'scale(0.95)';
      element.style.transition = 'all 0.2s ease';
    },
    []
  );

  /**
   * Завершить touch-перетаскивание
   */
  const endTouch = useCallback(() => {
    setTouchState((prev) => {
      // Восстанавливаем стили элемента
      if (prev.touchStartElement) {
        prev.touchStartElement.style.opacity = '';
        prev.touchStartElement.style.transform = '';
        prev.touchStartElement.style.transition = '';
      }

      return {
        touchedComponent: null,
        isDragging: false,
        touchStartElement: null,
      };
    });
  }, []);

  /**
   * Обновить позицию при перетаскивании
   * @param x - Координата X
   * @param y - Координата Y
   */
  const updateTouchPosition = useCallback((_x: number, _y: number) => {
    // Логика обновления позиции может быть добавлена здесь
  }, []);

  /**
   * Проверить, идёт ли перетаскивание указанного компонента
   * @param componentId - ID компонента
   * @returns True если этот компонент перетаскивается
   */
  const isDraggingComponent = useCallback(
    (componentId: string) => {
      return touchState.isDragging && touchState.touchedComponent?.id === componentId;
    },
    [touchState.isDragging, touchState.touchedComponent]
  );

  return {
    touchState,
    startTouch,
    endTouch,
    updateTouchPosition,
    isDraggingComponent,
  };
}
