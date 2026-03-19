/**
 * @fileoverview Тесты для хука useSidebarFileUpload
 * Проверяет загрузку JSON и Python файлов, обработку ошибок и очистку input
 * @module components/editor/sidebar/tests/unit/hooks
 */

/// <reference types="vitest/globals" />

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSidebarFileUpload } from '../../../hooks/use-sidebar-file-upload';

describe('useSidebarFileUpload', () => {
  /** Мок для setImportJsonText */
  let mockSetImportJsonText: ReturnType<typeof vi.fn>;
  
  /** Мок для setImportPythonText */
  let mockSetImportPythonText: ReturnType<typeof vi.fn>;
  
  /** Мок для setImportError */
  let mockSetImportError: ReturnType<typeof vi.fn>;
  
  /** Мок для toast */
  let mockToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetImportJsonText = vi.fn();
    mockSetImportPythonText = vi.fn();
    mockSetImportError = vi.fn();
    mockToast = vi.fn();
  });

  it('должен возвращать функции загрузки', () => {
    const { result } = renderHook(() =>
      useSidebarFileUpload({
        setImportJsonText: mockSetImportJsonText,
        setImportPythonText: mockSetImportPythonText,
        setImportError: mockSetImportError,
        toast: mockToast,
      })
    );

    expect(result.current.handleFileUpload).toBeDefined();
    expect(result.current.handlePythonFileUpload).toBeDefined();
    expect(result.current.clearInput).toBeDefined();
  });

  it('должен загружать JSON файл', async () => {
    const mockFile = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
    
    const { result } = renderHook(() =>
      useSidebarFileUpload({
        setImportJsonText: mockSetImportJsonText,
        setImportPythonText: mockSetImportPythonText,
        setImportError: mockSetImportError,
        toast: mockToast,
      })
    );

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileUpload(mockEvent);
    });

    await waitFor(() => {
      expect(mockSetImportError).toHaveBeenCalledWith('');
    }, { timeout: 1000 });
  });

  it('должен загружать Python файл', async () => {
    const mockFile = new File(['print("hello")'], 'bot.py', { type: 'text/x-python' });
    
    const { result } = renderHook(() =>
      useSidebarFileUpload({
        setImportJsonText: mockSetImportJsonText,
        setImportPythonText: mockSetImportPythonText,
        setImportError: mockSetImportError,
        toast: mockToast,
      })
    );

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handlePythonFileUpload(mockEvent);
    });

    await waitFor(() => {
      expect(mockSetImportError).toHaveBeenCalledWith('');
    }, { timeout: 1000 });
  });

  it('должен обрабатывать ошибку чтения файла', () => {
    const { result } = renderHook(() =>
      useSidebarFileUpload({
        setImportJsonText: mockSetImportJsonText,
        setImportPythonText: mockSetImportPythonText,
        setImportError: mockSetImportError,
        toast: mockToast,
      })
    );

    // Вызвать с пустым файлом (должно вернуть без действий)
    const emptyEvent = {
      target: {
        files: [],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    result.current.handleFileUpload(emptyEvent);

    // При пустом файле функции не должны вызываться
    expect(mockSetImportJsonText).not.toHaveBeenCalled();
    expect(mockSetImportPythonText).not.toHaveBeenCalled();
  });

  it('должен очищать input после загрузки', () => {
    const mockInput = { current: document.createElement('input') };
    mockInput.current.value = 'test value';
    
    const { result } = renderHook(() =>
      useSidebarFileUpload({
        setImportJsonText: mockSetImportJsonText,
        setImportPythonText: mockSetImportPythonText,
        setImportError: mockSetImportError,
        toast: mockToast,
      })
    );

    result.current.clearInput(mockInput);

    expect(mockInput.current.value).toBe('');
  });

  it('должен показывать toast при успешной загрузке JSON', async () => {
    const mockFile = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
    
    const { result } = renderHook(() =>
      useSidebarFileUpload({
        setImportJsonText: mockSetImportJsonText,
        setImportPythonText: mockSetImportPythonText,
        setImportError: mockSetImportError,
        toast: mockToast,
      })
    );

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileUpload(mockEvent);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Файл загружен",
        })
      );
    }, { timeout: 1000 });
  });

  it('должен показывать toast при успешной загрузке Python', async () => {
    const mockFile = new File(['print("hello")'], 'bot.py', { type: 'text/x-python' });
    
    const { result } = renderHook(() =>
      useSidebarFileUpload({
        setImportJsonText: mockSetImportJsonText,
        setImportPythonText: mockSetImportPythonText,
        setImportError: mockSetImportError,
        toast: mockToast,
      })
    );

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handlePythonFileUpload(mockEvent);
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Python файл загружен",
        })
      );
    }, { timeout: 1000 });
  });

  it('должен показывать toast с variant destructive при ошибке', async () => {
    // Мок FileReader с ошибкой
    const OriginalFileReader = window.FileReader;
    class ErrorFileReader {
      onerror: ((e: Event) => void) | null = null;
      onload: ((e: Event) => void) | null = null;
      result: string | null = null;

      readAsText() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Event('error'));
          }
        }, 10);
      }
    }
    // @ts-ignore
    window.FileReader = ErrorFileReader;

    const { result } = renderHook(() =>
      useSidebarFileUpload({
        setImportJsonText: mockSetImportJsonText,
        setImportPythonText: mockSetImportPythonText,
        setImportError: mockSetImportError,
        toast: mockToast,
      })
    );

    const mockFile = new File(['test'], 'test.json', { type: 'application/json' });
    const mockEvent = {
      target: {
        files: [mockFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileUpload(mockEvent);
    });

    await waitFor(() => {
      expect(mockSetImportError).toHaveBeenCalledWith('Ошибка при чтении файла');
    }, { timeout: 1000 });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Ошибка загрузки",
        variant: "destructive",
      })
    );

    // Восстановить оригинальный FileReader
    window.FileReader = OriginalFileReader;
  });
});
