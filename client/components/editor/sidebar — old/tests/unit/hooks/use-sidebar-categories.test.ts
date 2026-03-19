/**
 * @fileoverview Тесты для хука useSidebarCategories
 * Проверяет управление сворачиванием/разворачиванием категорий
 * @module components/editor/sidebar/tests/unit/hooks
 */

/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { useSidebarCategories } from '../../../hooks/use-sidebar-categories';

describe('useSidebarCategories', () => {
  it('должен инициализироваться с пустым множеством', () => {
    const { result } = renderHook(() => useSidebarCategories());

    expect(result.current.collapsedCategories.size).toBe(0);
  });

  it('должен переключать состояние категории', () => {
    const { result } = renderHook(() => useSidebarCategories());

    expect(result.current.isCollapsed('Сообщения')).toBe(false);

    act(() => {
      result.current.toggleCategory('Сообщения');
    });

    expect(result.current.isCollapsed('Сообщения')).toBe(true);

    act(() => {
      result.current.toggleCategory('Сообщения');
    });

    expect(result.current.isCollapsed('Сообщения')).toBe(false);
  });

  it('должен сворачивать категорию', () => {
    const { result } = renderHook(() => useSidebarCategories());

    act(() => {
      result.current.collapseCategory('Команды');
    });

    expect(result.current.isCollapsed('Команды')).toBe(true);
  });

  it('должен разворачивать категорию', () => {
    const { result } = renderHook(() => useSidebarCategories());

    act(() => {
      result.current.collapseCategory('Команды');
    });

    act(() => {
      result.current.expandCategory('Команды');
    });

    expect(result.current.isCollapsed('Команды')).toBe(false);
  });

  it('должен проверять свернута ли категория', () => {
    const { result } = renderHook(() => useSidebarCategories());

    act(() => {
      result.current.collapseCategory('Тест');
    });

    expect(result.current.isCollapsed('Тест')).toBe(true);
    expect(result.current.isCollapsed('Другое')).toBe(false);
  });

  it('должен разворачивать все категории', () => {
    const { result } = renderHook(() => useSidebarCategories());

    act(() => {
      result.current.collapseCategory('К1');
      result.current.collapseCategory('К2');
    });

    expect(result.current.collapsedCategories.size).toBe(2);

    act(() => {
      result.current.expandAll();
    });

    expect(result.current.collapsedCategories.size).toBe(0);
  });

  it('должен сворачивать все категории', () => {
    const { result } = renderHook(() => useSidebarCategories());

    act(() => {
      result.current.collapseAll(['К1', 'К2', 'К3']);
    });

    expect(result.current.collapsedCategories.size).toBe(3);
    expect(result.current.isCollapsed('К1')).toBe(true);
    expect(result.current.isCollapsed('К2')).toBe(true);
    expect(result.current.isCollapsed('К3')).toBe(true);
  });

  it('должен возвращать все методы', () => {
    const { result } = renderHook(() => useSidebarCategories());

    expect(result.current.collapsedCategories).toBeDefined();
    expect(result.current.toggleCategory).toBeDefined();
    expect(result.current.collapseCategory).toBeDefined();
    expect(result.current.expandCategory).toBeDefined();
    expect(result.current.isCollapsed).toBeDefined();
    expect(result.current.expandAll).toBeDefined();
    expect(result.current.collapseAll).toBeDefined();
  });
});
