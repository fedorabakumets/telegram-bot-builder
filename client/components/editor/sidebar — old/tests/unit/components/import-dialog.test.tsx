/**
 * @fileoverview Тесты для компонента ImportDialog
 * Проверяет рендеринг, взаимодействие и обработку событий
 * @module tests/unit/components/import-dialog.test
 */

/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportDialog } from '../../../components/import-dialog';

/**
 * Моковые данные для тестов
 */
const defaultProps = {
  isOpen: true,
  importState: {
    jsonText: '',
    pythonText: '',
    error: '',
  },
  onOpenChange: vi.fn(),
  onJsonTextChange: vi.fn(),
  onPythonTextChange: vi.fn(),
  onErrorChange: vi.fn(),
  onImport: vi.fn(),
  fileInputRef: { current: null },
  pythonFileInputRef: { current: null },
  onFileUpload: vi.fn(),
  onPythonFileUpload: vi.fn(),
};

describe('ImportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен рендерить диалог когда isOpen=true', () => {
    render(<ImportDialog {...defaultProps} isOpen={true} />);

    expect(screen.getByText('Импортировать проект')).toBeInTheDocument();
    expect(screen.getByText('Вставьте JSON или загрузите файл с данными проекта')).toBeInTheDocument();
  });

  it('не должен рендерить когда isOpen=false', () => {
    render(<ImportDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Импортировать проект')).not.toBeInTheDocument();
  });

  it('должен вызывать onJsonTextChange при вводе текста', () => {
    const onJsonTextChange = vi.fn();
    render(<ImportDialog {...defaultProps} onJsonTextChange={onJsonTextChange} />);

    const textarea = screen.getByTestId('textarea-import-json');
    fireEvent.change(textarea, { target: { value: '{"name": "Test"}' } });

    expect(onJsonTextChange).toHaveBeenCalledWith('{"name": "Test"}');
  });

  it('должен вызывать onImport при клике на кнопку Импортировать', () => {
    const onImport = vi.fn();
    render(
      <ImportDialog
        {...defaultProps}
        importState={{ ...defaultProps.importState, jsonText: '{"name": "Test"}' }}
        onImport={onImport}
      />
    );

    const importButton = screen.getByTestId('button-confirm-import');
    fireEvent.click(importButton);

    expect(onImport).toHaveBeenCalled();
  });

  it('должен показывать ошибку если importState.error задан', () => {
    const errorMessage = 'Ошибка импорта: неверный формат JSON';
    render(
      <ImportDialog
        {...defaultProps}
        importState={{ ...defaultProps.importState, error: errorMessage }}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('должен вызывать onPythonTextChange при изменении Python текста', () => {
    const onPythonTextChange = vi.fn();
    const onJsonTextChange = vi.fn();
    const onErrorChange = vi.fn();

    render(
      <ImportDialog
        {...defaultProps}
        onPythonTextChange={onPythonTextChange}
        onJsonTextChange={onJsonTextChange}
        onErrorChange={onErrorChange}
      />
    );

    // Проверяем что textarea для JSON вызывает очистку python текста
    const textarea = screen.getByTestId('textarea-import-json');
    fireEvent.change(textarea, { target: { value: '{"test": true}' } });

    expect(onJsonTextChange).toHaveBeenCalledWith('{"test": true}');
    expect(onPythonTextChange).toHaveBeenCalledWith('');
    expect(onErrorChange).toHaveBeenCalledWith('');
  });

  it('должен вызывать onOpenChange при клике на кнопку Отмена', () => {
    const onOpenChange = vi.fn();
    const onJsonTextChange = vi.fn();
    const onPythonTextChange = vi.fn();
    const onErrorChange = vi.fn();

    render(
      <ImportDialog
        {...defaultProps}
        onOpenChange={onOpenChange}
        onJsonTextChange={onJsonTextChange}
        onPythonTextChange={onPythonTextChange}
        onErrorChange={onErrorChange}
      />
    );

    const cancelButton = screen.getByTestId('button-cancel-import');
    fireEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onJsonTextChange).toHaveBeenCalledWith('');
    expect(onPythonTextChange).toHaveBeenCalledWith('');
    expect(onErrorChange).toHaveBeenCalledWith('');
  });

  it('должен вызывать onFileUpload при выборе JSON файла', () => {
    const onFileUpload = vi.fn();
    render(<ImportDialog {...defaultProps} onFileUpload={onFileUpload} />);

    const fileInput = screen.getByTestId('input-import-file');
    const file = new File(['{"test": true}'], 'test.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onFileUpload).toHaveBeenCalled();
  });

  it('должен вызывать onPythonFileUpload при выборе Python файла', () => {
    const onPythonFileUpload = vi.fn();
    render(<ImportDialog {...defaultProps} onPythonFileUpload={onPythonFileUpload} />);

    const fileInput = screen.getByTestId('input-import-python');
    const file = new File(['print("hello")'], 'bot.py', { type: 'text/x-python' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onPythonFileUpload).toHaveBeenCalled();
  });

  it('должен блокировать кнопку Импортировать когда нет текста', () => {
    render(<ImportDialog {...defaultProps} importState={{ jsonText: '', pythonText: '', error: '' }} />);

    const importButton = screen.getByTestId('button-confirm-import');
    expect(importButton).toBeDisabled();
  });

  it('должен активировать кнопку Импортировать когда есть JSON текст', () => {
    render(
      <ImportDialog
        {...defaultProps}
        importState={{ jsonText: '{"test": true}', pythonText: '', error: '' }}
      />
    );

    const importButton = screen.getByTestId('button-confirm-import');
    expect(importButton).not.toBeDisabled();
  });

  it('должен активировать кнопку Импортировать когда есть Python текст', () => {
    render(
      <ImportDialog
        {...defaultProps}
        importState={{ jsonText: '', pythonText: 'print("hello")', error: '' }}
      />
    );

    const importButton = screen.getByTestId('button-confirm-import');
    expect(importButton).not.toBeDisabled();
  });
});
