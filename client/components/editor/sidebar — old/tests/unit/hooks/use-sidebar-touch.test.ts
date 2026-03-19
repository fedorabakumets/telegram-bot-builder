/**
 * @fileoverview Тесты для хука useSidebarTouch
 * Проверяет управление touch-перетаскиванием компонентов
 * @module components/editor/sidebar/tests/unit/hooks
 */

/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { useSidebarTouch } from '../../../hooks/use-sidebar-touch';
import type { ComponentDefinition } from '@shared/schema';

const mockComponent: ComponentDefinition = {
  id: 'test-component',
  name: 'Тестовый компонент',
  description: 'Описание',
  icon: 'test-icon',
  color: 'bg-blue-500',
  type: 'message',
  category: 'Сообщения',
};

const mockElement = {
  style: {
    opacity: '',
    transform: '',
    transition: '',
  },
} as unknown as HTMLElement;

describe('useSidebarTouch', () => {
  it('должен инициализироваться с пустым состоянием', () => {
    const { result } = renderHook(() => useSidebarTouch());

    expect(result.current.touchState.touchedComponent).toBeNull();
    expect(result.current.touchState.isDragging).toBe(false);
    expect(result.current.touchState.touchStartElement).toBeNull();
  });

  it('должен начинать touch-перетаскивание', () => {
    const { result } = renderHook(() => useSidebarTouch());

    act(() => {
      result.current.startTouch(mockComponent, mockElement);
    });

    expect(result.current.touchState.touchedComponent).toBe(mockComponent);
    expect(result.current.touchState.isDragging).toBe(true);
    expect(result.current.touchState.touchStartElement).toBe(mockElement);
  });

  it('должен завершать touch-перетаскивание', () => {
    const { result } = renderHook(() => useSidebarTouch());

    act(() => {
      result.current.startTouch(mockComponent, mockElement);
    });

    act(() => {
      result.current.endTouch();
    });

    expect(result.current.touchState.touchedComponent).toBeNull();
    expect(result.current.touchState.isDragging).toBe(false);
    expect(result.current.touchState.touchStartElement).toBeNull();
  });

  it('должен обновлять позицию при перетаскивании', () => {
    const { result } = renderHook(() => useSidebarTouch());
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    act(() => {
      result.current.updateTouchPosition(100, 200);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Touch move:', { x: 100, y: 200 });

    consoleSpy.mockRestore();
  });

  it('должен проверять перетаскивание компонента по ID', () => {
    const { result } = renderHook(() => useSidebarTouch());

    act(() => {
      result.current.startTouch(mockComponent, mockElement);
    });

    expect(result.current.isDraggingComponent('test-component')).toBe(true);
    expect(result.current.isDraggingComponent('other-component')).toBe(false);
  });

  it('должен возвращать false при завершении перетаскивания', () => {
    const { result } = renderHook(() => useSidebarTouch());

    act(() => {
      result.current.startTouch(mockComponent, mockElement);
      result.current.endTouch();
    });

    expect(result.current.isDraggingComponent('test-component')).toBe(false);
  });

  it('должен возвращать все методы', () => {
    const { result } = renderHook(() => useSidebarTouch());

    expect(result.current.touchState).toBeDefined();
    expect(result.current.startTouch).toBeDefined();
    expect(result.current.endTouch).toBeDefined();
    expect(result.current.updateTouchPosition).toBeDefined();
    expect(result.current.isDraggingComponent).toBeDefined();
  });
});
