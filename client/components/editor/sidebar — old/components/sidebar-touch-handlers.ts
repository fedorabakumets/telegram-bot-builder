/**
 * @fileoverview Обработчики touch-событий для мобильных устройств
 * Предоставляет функции для drag-and-drop компонентов через touch-интерфейс
 * @module components/editor/sidebar/components/sidebar-touch-handlers
 */

import { ComponentDefinition } from '@shared/schema';
import { UseSidebarTouchResult } from '../hooks/use-sidebar-touch';

/**
 * Параметры для инициализации touch-обработчиков
 */
export interface TouchHandlersParams {
  /** Хук управления touch-состоянием */
  touchHook: UseSidebarTouchResult;
  /** Колбэк при начале перетаскивания компонента */
  onComponentDrag: (component: ComponentDefinition) => void;
}

/**
 * Результат работы фабрики touch-обработчиков
 */
export interface TouchHandlers {
  /** Обработчик начала касания компонента */
  handleTouchStart: (e: React.TouchEvent, component: ComponentDefinition) => void;
  /** Обработчик движения касания */
  handleTouchMove: (e: React.TouchEvent) => void;
  /** Обработчик окончания касания */
  handleTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Создаёт обработчики touch-событий для drag-and-drop компонентов
 * @param params - Параметры обработчиков
 * @returns Объект с обработчиками событий
 */
export function createTouchHandlers({
  touchHook,
  onComponentDrag
}: TouchHandlersParams): TouchHandlers {
  const {
    touchState,
    startTouch,
    endTouch,
    updateTouchPosition
  } = touchHook;

  /**
   * Обработчик начала касания для мобильных устройств
   * Инициализирует touch-based drag-and-drop
   * @param e - Событие касания
   * @param component - Компонент для перетаскивания
   */
  const handleTouchStart = (e: React.TouchEvent, component: ComponentDefinition) => {
    console.log('Touch start on component:', component.name);
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;

    startTouch(component, element);
    onComponentDrag(component);

    console.log('Touch drag started for:', component.name, {
      touchPos: { x: touch.clientX, y: touch.clientY },
      elementRect: element.getBoundingClientRect()
    });
  };

  /**
   * Обработчик движения касания
   * Отслеживает перемещение пальца по экрану
   * @param e - Событие движения касания
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.isDragging || !touchState.touchedComponent) return;
    e.preventDefault();
    e.stopPropagation();
    updateTouchPosition(e.touches[0].clientX, e.touches[0].clientY);
  };

  /**
   * Обработчик окончания касания
   * Завершает touch-based drag-and-drop и проверяет попадание на холст
   * @param e - Событие окончания касания
   */
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchState.isDragging || !touchState.touchedComponent) {
      console.log('Touch end ignored - not dragging or no component');
      return;
    }

    console.log('Touch end for component:', touchState.touchedComponent.name);
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    console.log('Touch end position:', { x: touch.clientX, y: touch.clientY });
    console.log('Element at touch point:', element);

    // Проверяем, попали ли мы на холст или в область холста
    const canvas = document.querySelector('[data-canvas-drop-zone]');
    console.log('Canvas element found:', canvas);

    if (canvas && element) {
      const isInCanvas = canvas.contains(element) || element === canvas ||
        element.closest('[data-canvas-drop-zone]') === canvas;

      console.log('Is in canvas:', isInCanvas);

      if (isInCanvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const dropPosition = {
          x: touch.clientX - canvasRect.left,
          y: touch.clientY - canvasRect.top
        };

        const dropEvent = new CustomEvent('canvas-drop', {
          detail: {
            component: touchState.touchedComponent,
            position: dropPosition
          }
        });
        canvas.dispatchEvent(dropEvent);
      }
    }

    endTouch();
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}

/**
 * Глобальные touch обработчики для лучшей поддержки мобильных устройств
 * Обеспечивают корректную работу drag-and-drop на всем экране
 * @param touchState - Состояние touch-перетаскивания
 * @param endTouch - Функция завершения touch-перетаскивания
 * @returns Функция очистки обработчиков
 */
export function registerGlobalTouchHandlers(
  touchState: UseSidebarTouchResult['touchState'],
  endTouch: UseSidebarTouchResult['endTouch']
): () => void {
  const handleGlobalTouchMove = (e: TouchEvent) => {
    if (touchState.isDragging && touchState.touchedComponent) {
      e.preventDefault();
    }
  };

  const handleGlobalTouchEnd = (e: TouchEvent) => {
    if (!touchState.isDragging || !touchState.touchedComponent) return;

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const canvas = document.querySelector('[data-canvas-drop-zone]');

    if (canvas && element) {
      const isInCanvas = canvas.contains(element) || element === canvas ||
        element.closest('[data-canvas-drop-zone]') === canvas;

      if (isInCanvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const dropPosition = {
          x: touch.clientX - canvasRect.left,
          y: touch.clientY - canvasRect.top
        };

        const dropEvent = new CustomEvent('canvas-drop', {
          detail: {
            component: touchState.touchedComponent,
            position: dropPosition
          }
        });
        canvas.dispatchEvent(dropEvent);
      }
    }

    endTouch();
  };

  if (touchState.isDragging) {
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
  }

  // Возвращаем функцию очистки
  return () => {
    document.removeEventListener('touchmove', handleGlobalTouchMove);
    document.removeEventListener('touchend', handleGlobalTouchEnd);
  };
}
