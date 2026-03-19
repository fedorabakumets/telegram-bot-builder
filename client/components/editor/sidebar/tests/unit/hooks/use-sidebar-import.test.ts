/**
 * @fileoverview Тесты для хука useSidebarImport
 * Проверяет управление состоянием импорта проекта
 * @module components/editor/sidebar/tests/unit/hooks
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebarImport } from '../../../hooks/use-sidebar-import';

describe('useSidebarImport', () => {
  it('должен инициализироваться с закрытым диалогом и пустыми данными', () => {
    const { result } = renderHook(() => useSidebarImport());

    expect(result.current.importState.isOpen).toBe(false);
    expect(result.current.importState.jsonText).toBe('');
    expect(result.current.importState.pythonText).toBe('');
    expect(result.current.importState.error).toBe('');
  });

  it('должен открывать диалог', () => {
    const { result } = renderHook(() => useSidebarImport());

    act(() => {
      result.current.openDialog();
    });

    expect(result.current.importState.isOpen).toBe(true);
  });

  it('должен закрывать диалог', () => {
    const { result } = renderHook(() => useSidebarImport());

    act(() => {
      result.current.openDialog();
    });

    act(() => {
      result.current.closeDialog();
    });

    expect(result.current.importState.isOpen).toBe(false);
  });

  it('должен устанавливать JSON текст', () => {
    const { result } = renderHook(() => useSidebarImport());

    act(() => {
      result.current.setJsonText('{"name": "test"}');
    });

    expect(result.current.importState.jsonText).toBe('{"name": "test"}');
  });

  it('должен устанавливать Python текст', () => {
    const { result } = renderHook(() => useSidebarImport());

    act(() => {
      result.current.setPythonText('print("hello")');
    });

    expect(result.current.importState.pythonText).toBe('print("hello")');
  });

  it('должен устанавливать ошибку', () => {
    const { result } = renderHook(() => useSidebarImport());

    act(() => {
      result.current.setError('Ошибка импорта');
    });

    expect(result.current.importState.error).toBe('Ошибка импорта');
  });

  it('должен очищать все данные импорта', () => {
    const { result } = renderHook(() => useSidebarImport());

    // Устанавливаем данные
    act(() => {
      result.current.openDialog();
      result.current.setJsonText('{"test": true}');
      result.current.setPythonText('test');
      result.current.setError('error');
    });

    // Очищаем
    act(() => {
      result.current.clearImport();
    });

    expect(result.current.importState.isOpen).toBe(false);
    expect(result.current.importState.jsonText).toBe('');
    expect(result.current.importState.pythonText).toBe('');
    expect(result.current.importState.error).toBe('');
  });

  it('должен возвращать все методы', () => {
    const { result } = renderHook(() => useSidebarImport());

    expect(result.current.importState).toBeDefined();
    expect(result.current.openDialog).toBeDefined();
    expect(result.current.closeDialog).toBeDefined();
    expect(result.current.setJsonText).toBeDefined();
    expect(result.current.setPythonText).toBeDefined();
    expect(result.current.setError).toBeDefined();
    expect(result.current.clearImport).toBeDefined();
  });
});
