/**
 * @fileoverview Тесты для хука useSidebarDragState
 * Проверяет управление состоянием drag-and-drop проектов и листов
 * @module components/editor/sidebar/tests/unit/hooks
 */

/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { useSidebarDragState } from '../../../hooks/use-sidebar-drag-state';
import type { BotProject } from '@shared/schema';

const mockProject: BotProject = {
  id: 1,
  name: 'Test Project',
  description: null,
  data: { nodes: [], connections: [] },
  createdAt: null,
  updatedAt: null,
  ownerId: null,
  botToken: null,
  userDatabaseEnabled: null,
  lastExportedAt: null,
  lastExportedStructureAt: null,
  lastExportedGoogleSheetId: null,
  lastExportedGoogleSheetUrl: null,
  lastExportedStructureSheetId: null,
  lastExportedStructureSheetUrl: null,
};

describe('useSidebarDragState', () => {
  it('должен инициализироваться с пустым состоянием', () => {
    const { result } = renderHook(() => useSidebarDragState());

    expect(result.current.projectDragState.draggedProject).toBeNull();
    expect(result.current.projectDragState.dragOverProject).toBeNull();
    expect(result.current.sheetDragState.draggedSheet).toBeNull();
    expect(result.current.sheetDragState.dragOverSheet).toBeNull();
  });

  it('должен устанавливать перетаскиваемый проект', () => {
    const { result } = renderHook(() => useSidebarDragState());

    act(() => {
      result.current.setDraggedProject(mockProject);
    });

    expect(result.current.projectDragState.draggedProject).toBe(mockProject);
  });

  it('должен устанавливать проект над которым курсор', () => {
    const { result } = renderHook(() => useSidebarDragState());

    act(() => {
      result.current.setDragOverProject(123);
    });

    expect(result.current.projectDragState.dragOverProject).toBe(123);
  });

  it('должен устанавливать перетаскиваемый лист', () => {
    const { result } = renderHook(() => useSidebarDragState());

    act(() => {
      result.current.setDraggedSheet({ sheetId: 'sheet-1', projectId: 1 });
    });

    expect(result.current.sheetDragState.draggedSheet).toEqual({
      sheetId: 'sheet-1',
      projectId: 1,
    });
  });

  it('должен устанавливать лист над которым курсор', () => {
    const { result } = renderHook(() => useSidebarDragState());

    act(() => {
      result.current.setDragOverSheet('sheet-123');
    });

    expect(result.current.sheetDragState.dragOverSheet).toBe('sheet-123');
  });

  it('должен сбрасывать все состояния drag-and-drop', () => {
    const { result } = renderHook(() => useSidebarDragState());

    // Устанавливаем состояния
    act(() => {
      result.current.setDraggedProject(mockProject);
      result.current.setDragOverProject(123);
      result.current.setDraggedSheet({ sheetId: 'sheet-1', projectId: 1 });
      result.current.setDragOverSheet('sheet-123');
    });

    // Сбрасываем
    act(() => {
      result.current.resetDragState();
    });

    expect(result.current.projectDragState.draggedProject).toBeNull();
    expect(result.current.projectDragState.dragOverProject).toBeNull();
    expect(result.current.sheetDragState.draggedSheet).toBeNull();
    expect(result.current.sheetDragState.dragOverSheet).toBeNull();
  });

  it('должен возвращать все методы', () => {
    const { result } = renderHook(() => useSidebarDragState());

    expect(result.current.projectDragState).toBeDefined();
    expect(result.current.sheetDragState).toBeDefined();
    expect(result.current.setDraggedProject).toBeDefined();
    expect(result.current.setDragOverProject).toBeDefined();
    expect(result.current.setDraggedSheet).toBeDefined();
    expect(result.current.setDragOverSheet).toBeDefined();
    expect(result.current.resetDragState).toBeDefined();
  });
});
