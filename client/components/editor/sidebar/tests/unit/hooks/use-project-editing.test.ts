/**
 * @fileoverview Тесты для хука useProjectEditing
 * Проверяет корректность управления состоянием редактирования проекта
 * @module components/editor/sidebar/tests/unit/hooks/use-project-editing.test
 */

/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useProjectEditing } from '../../../hooks/use-project-editing';

describe('useProjectEditing', () => {
  it('должен инициализироваться с пустым состоянием', () => {
    const { result } = renderHook(() => useProjectEditing());

    expect(result.current.editingState).toEqual({
      editingProjectId: null,
      editingProjectName: '',
    });
  });

  it('должен начинать редактирование проекта', () => {
    const { result } = renderHook(() => useProjectEditing());

    act(() => {
      result.current.startEditing(1, 'Test Project');
    });

    expect(result.current.editingState).toEqual({
      editingProjectId: 1,
      editingProjectName: 'Test Project',
    });
  });

  it('должен изменять имя в процессе редактирования', () => {
    const { result } = renderHook(() => useProjectEditing());

    act(() => {
      result.current.startEditing(1, 'Test Project');
      result.current.setEditingName('Updated Project');
    });

    expect(result.current.editingState).toEqual({
      editingProjectId: 1,
      editingProjectName: 'Updated Project',
    });
  });

  it('должен сохранять имя проекта и сбрасывать состояние', () => {
    const { result } = renderHook(() => useProjectEditing());

    act(() => {
      result.current.startEditing(1, 'Test Project');
    });

    let savedResult;
    act(() => {
      savedResult = result.current.saveEditing();
    });

    expect(savedResult).toEqual({
      projectId: 1,
      newName: 'Test Project',
    });

    expect(result.current.editingState).toEqual({
      editingProjectId: null,
      editingProjectName: '',
    });
  });

  it('должен отменять редактирование и сбрасывать состояние', () => {
    const { result } = renderHook(() => useProjectEditing());

    act(() => {
      result.current.startEditing(1, 'Test Project');
    });

    act(() => {
      result.current.cancelEditing();
    });

    expect(result.current.editingState).toEqual({
      editingProjectId: null,
      editingProjectName: '',
    });
  });

  it('должен поддерживать полный цикл редактирования', () => {
    const { result } = renderHook(() => useProjectEditing());

    // Начать редактирование
    act(() => {
      result.current.startEditing(42, 'Original Name');
    });

    expect(result.current.editingState.editingProjectId).toBe(42);
    expect(result.current.editingState.editingProjectName).toBe('Original Name');

    // Изменить имя
    act(() => {
      result.current.setEditingName('New Project Name');
    });

    expect(result.current.editingState.editingProjectName).toBe('New Project Name');

    // Сохранить
    let savedResult;
    act(() => {
      savedResult = result.current.saveEditing();
    });

    expect(savedResult).toEqual({
      projectId: 42,
      newName: 'New Project Name',
    });
    expect(result.current.editingState.editingProjectId).toBeNull();
    expect(result.current.editingState.editingProjectName).toBe('');
  });
});
