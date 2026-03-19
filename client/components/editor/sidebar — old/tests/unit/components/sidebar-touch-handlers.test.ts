/**
 * @fileoverview Тесты для обработчиков touch-событий
 * Проверяет корректность работы touch-based drag-and-drop
 * @module components/editor/sidebar/components/tests/sidebar-touch-handlers.test
 */

/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import {
  createTouchHandlers,
  registerGlobalTouchHandlers,
  type TouchHandlers
} from '../../../components/sidebar-touch-handlers';
import { ComponentDefinition } from '@shared/schema';

// Mock document.elementFromPoint for jsdom (not available by default)
beforeAll(() => {
  // Define elementFromPoint if it doesn't exist
  if (!document.elementFromPoint) {
    (document as any).elementFromPoint = vi.fn().mockReturnValue(null);
  } else {
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
  }
  vi.spyOn(document, 'addEventListener').mockImplementation(() => {});
  vi.spyOn(document, 'removeEventListener').mockImplementation(() => {});
});

/**
 * Моковый компонент для тестирования
 */
const mockComponent: ComponentDefinition = {
  id: 'test-component',
  name: 'Тестовый компонент',
  icon: 'test-icon',
  description: 'Тестовое описание',
  category: 'Сообщения',
  type: 'message',
  color: 'bg-blue-500'
};

/**
 * Создаёт моковый touchHook для тестов
 */
function createMockTouchHook() {
  return {
    touchState: {
      touchedComponent: null as ComponentDefinition | null,
      isDragging: false,
      touchStartElement: null as HTMLElement | null
    },
    startTouch: vi.fn(),
    endTouch: vi.fn(),
    updateTouchPosition: vi.fn(),
    isDraggingComponent: vi.fn()
  };
}

/**
 * Создаёт моковое событие TouchEvent
 */
function createMockTouchEvent(overrides?: Partial<React.TouchEvent>): React.TouchEvent {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    touches: [{
      clientX: 100,
      clientY: 200,
      target: document.createElement('div')
    } as any],
    changedTouches: [{
      clientX: 100,
      clientY: 200,
      target: document.createElement('div')
    } as any],
    ...overrides
  } as React.TouchEvent;
}

/**
 * Создаёт моковый DOMRect
 */
function createMockDOMRect(overrides?: Partial<DOMRect>): DOMRect {
  return {
    left: 0,
    top: 0,
    width: 100,
    height: 50,
    x: 0,
    y: 0,
    bottom: 50,
    right: 100,
    toJSON: vi.fn(),
    ...overrides
  } as DOMRect;
}

describe('createTouchHandlers', () => {
  let mockTouchHook: ReturnType<typeof createMockTouchHook>;
  let mockOnComponentDrag: ReturnType<typeof vi.fn>;
  let handlers: TouchHandlers;

  beforeEach(() => {
    mockTouchHook = createMockTouchHook();
    mockOnComponentDrag = vi.fn();
    handlers = createTouchHandlers({
      touchHook: mockTouchHook,
      onComponentDrag: mockOnComponentDrag
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleTouchStart', () => {
    it('должен вызывать startTouch с компонентом и элементом', () => {
      const element = document.createElement('div');
      const mockEvent = createMockTouchEvent();
      
      // Мокаем getBoundingClientRect
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(createMockDOMRect());

      handlers.handleTouchStart({
        ...mockEvent,
        currentTarget: element
      } as any, mockComponent);

      expect(mockTouchHook.startTouch).toHaveBeenCalledWith(mockComponent, element);
    });

    it('должен вызывать onComponentDrag с компонентом', () => {
      const element = document.createElement('div');
      const mockEvent = createMockTouchEvent();

      handlers.handleTouchStart({
        ...mockEvent,
        currentTarget: element
      } as any, mockComponent);

      expect(mockOnComponentDrag).toHaveBeenCalledWith(mockComponent);
    });

    it('должен предотвращать стандартное поведение', () => {
      const element = document.createElement('div');
      const mockEvent = createMockTouchEvent();

      handlers.handleTouchStart({
        ...mockEvent,
        currentTarget: element
      } as any, mockComponent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('handleTouchMove', () => {
    it('должен вызывать updatePosition при активном drag', () => {
      mockTouchHook.touchState.isDragging = true;
      mockTouchHook.touchState.touchedComponent = mockComponent;
      
      const mockEvent = createMockTouchEvent();

      handlers.handleTouchMove(mockEvent);

      expect(mockTouchHook.updateTouchPosition).toHaveBeenCalledWith(100, 200);
    });

    it('не должен вызывать updatePosition если не drag', () => {
      mockTouchHook.touchState.isDragging = false;
      mockTouchHook.touchState.touchedComponent = null;
      
      const mockEvent = createMockTouchEvent();

      handlers.handleTouchMove(mockEvent);

      expect(mockTouchHook.updateTouchPosition).not.toHaveBeenCalled();
    });

    it('должен предотвращать стандартное поведение', () => {
      mockTouchHook.touchState.isDragging = true;
      mockTouchHook.touchState.touchedComponent = mockComponent;
      
      const mockEvent = createMockTouchEvent();

      handlers.handleTouchMove(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('handleTouchEnd', () => {
    beforeEach(() => {
      mockTouchHook.touchState.isDragging = true;
      mockTouchHook.touchState.touchedComponent = mockComponent;
    });

    it('должен вызывать endTouch после завершения', () => {
      const mockEvent = createMockTouchEvent();

      handlers.handleTouchEnd(mockEvent);

      expect(mockTouchHook.endTouch).toHaveBeenCalled();
    });

    it('должен игнорировать если не drag', () => {
      mockTouchHook.touchState.isDragging = false;
      mockTouchHook.touchState.touchedComponent = null;
      
      const mockEvent = createMockTouchEvent();

      handlers.handleTouchEnd(mockEvent);

      expect(mockTouchHook.endTouch).not.toHaveBeenCalled();
    });

    it('должен создавать canvas-drop событие при попадании на холст', () => {
      // Создаём моковый canvas
      const mockCanvas = document.createElement('div');
      mockCanvas.setAttribute('data-canvas-drop-zone', 'true');
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue(createMockDOMRect({
        left: 50,
        top: 50,
        width: 800,
        height: 600
      }));

      document.body.appendChild(mockCanvas);

      const mockEvent = createMockTouchEvent();

      // Мокаем elementFromPoint чтобы вернуть canvas
      vi.spyOn(document, 'elementFromPoint').mockReturnValue(mockCanvas);

      handlers.handleTouchEnd(mockEvent);

      expect(mockTouchHook.endTouch).toHaveBeenCalled();

      // Очищаем
      document.body.removeChild(mockCanvas);
    });
  });
});

describe('registerGlobalTouchHandlers', () => {
  let mockEndTouch: ReturnType<typeof vi.fn>;
  let cleanup: () => void;

  afterEach(() => {
    if (cleanup) cleanup();
    vi.clearAllMocks();
  });

  it('должен регистрировать обработчики при isDragging=true', () => {
    mockEndTouch = vi.fn();
    const mockTouchState = {
      isDragging: true,
      touchedComponent: mockComponent,
      touchStartElement: null
    };

    cleanup = registerGlobalTouchHandlers(mockTouchState, mockEndTouch);

    expect(document.addEventListener).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function),
      { passive: false }
    );

    cleanup();
  });

  it('должен возвращать функцию очистки', () => {
    mockEndTouch = vi.fn();
    const mockTouchState = {
      isDragging: true,
      touchedComponent: mockComponent,
      touchStartElement: null
    };

    cleanup = registerGlobalTouchHandlers(mockTouchState, mockEndTouch);
    cleanup();

    expect(document.removeEventListener).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function)
    );
  });

  it('не должен регистрировать обработчики при isDragging=false', () => {
    mockEndTouch = vi.fn();
    const mockTouchState = {
      isDragging: false,
      touchedComponent: null,
      touchStartElement: null
    };

    cleanup = registerGlobalTouchHandlers(mockTouchState, mockEndTouch);

    expect(document.addEventListener).not.toHaveBeenCalled();

    cleanup();
  });
});
