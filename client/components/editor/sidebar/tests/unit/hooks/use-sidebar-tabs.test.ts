/**
 * @fileoverview Тесты для хука useSidebarTabs
 * Проверяет переключение между вкладками элементов и проектов
 * @module components/editor/sidebar/tests/unit/hooks
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebarTabs } from '../../../hooks/use-sidebar-tabs';

describe('useSidebarTabs', () => {
  it('должен инициализироваться с вкладкой "elements"', () => {
    const { result } = renderHook(() => useSidebarTabs());
    
    expect(result.current.currentTab).toBe('elements');
  });

  it('должен переключаться на вкладку "projects"', () => {
    const { result } = renderHook(() => useSidebarTabs());
    
    act(() => {
      result.current.setCurrentTab('projects');
    });
    
    expect(result.current.currentTab).toBe('projects');
  });

  it('должен переключаться на вкладку "elements"', () => {
    const { result } = renderHook(() => useSidebarTabs());
    
    act(() => {
      result.current.setCurrentTab('elements');
    });
    
    expect(result.current.currentTab).toBe('elements');
  });

  it('должен переключаться через showElements', () => {
    const { result } = renderHook(() => useSidebarTabs());
    
    act(() => {
      result.current.setCurrentTab('projects');
    });
    
    expect(result.current.currentTab).toBe('projects');
    
    act(() => {
      result.current.showElements();
    });
    
    expect(result.current.currentTab).toBe('elements');
  });

  it('должен переключаться через showProjects', () => {
    const { result } = renderHook(() => useSidebarTabs());
    
    act(() => {
      result.current.showProjects();
    });
    
    expect(result.current.currentTab).toBe('projects');
  });

  it('должен возвращать все методы', () => {
    const { result } = renderHook(() => useSidebarTabs());
    
    expect(result.current.currentTab).toBeDefined();
    expect(result.current.setCurrentTab).toBeDefined();
    expect(result.current.showElements).toBeDefined();
    expect(result.current.showProjects).toBeDefined();
  });
});
