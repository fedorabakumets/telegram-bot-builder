/**
 * @fileoverview Тесты для хука useSidebarEditing
 * Проверяет управление inline редактированием листов
 * @module components/editor/sidebar/tests/unit/hooks
 */

/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { useSidebarEditing } from '../../../hooks/use-sidebar-editing';

describe('useSidebarEditing', () => {
  it('должен инициализироваться с пустым состоянием', () => {
    const { result } = renderHook(() => useSidebarEditing());

    expect(result.current.editingState.editingSheetId).toBeNull();
    expect(result.current.editingState.editingSheetName).toBe('');
  });

  it('должен начинать редактирование', () => {
    const { result } = renderHook(() => useSidebarEditing());

    act(() => {
      result.current.startEditing('sheet-1', 'Лист 1');
    });

    expect(result.current.editingState.editingSheetId).toBe('sheet-1');
    expect(result.current.editingState.editingSheetName).toBe('Лист 1');
  });

  it('должен сохранять имя и возвращать значения', () => {
    const { result } = renderHook(() => useSidebarEditing());

    act(() => {
      result.current.startEditing('sheet-1', 'Лист 1');
    });

    let savedValue: ReturnType<typeof result.current.saveEditing>;
    act(() => {
      result.current.setEditingName('Новое имя');
    });

    act(() => {
      savedValue = result.current.saveEditing();
    });

    expect(savedValue!.sheetId).toBe('sheet-1');
    expect(savedValue!.newName).toBe('Новое имя');
    expect(result.current.editingState.editingSheetId).toBeNull();
    expect(result.current.editingState.editingSheetName).toBe('');
  });

  it('должен отменять редактирование', () => {
    const { result } = renderHook(() => useSidebarEditing());

    act(() => {
      result.current.startEditing('sheet-1', 'Лист 1');
    });

    act(() => {
      result.current.cancelEditing();
    });

    expect(result.current.editingState.editingSheetId).toBeNull();
    expect(result.current.editingState.editingSheetName).toBe('');
  });

  it('должен изменять имя в процессе редактирования', () => {
    const { result } = renderHook(() => useSidebarEditing());

    act(() => {
      result.current.startEditing('sheet-1', 'Лист 1');
    });

    act(() => {
      result.current.setEditingName('Измененное имя');
    });

    expect(result.current.editingState.editingSheetName).toBe('Измененное имя');
  });

  it('должен возвращать все методы', () => {
    const { result } = renderHook(() => useSidebarEditing());

    expect(result.current.editingState).toBeDefined();
    expect(result.current.startEditing).toBeDefined();
    expect(result.current.saveEditing).toBeDefined();
    expect(result.current.cancelEditing).toBeDefined();
    expect(result.current.setEditingName).toBeDefined();
  });
});
