/**
 * @fileoverview Хук для загрузки файлов в sidebar
 * Предоставляет функции для загрузки JSON и Python файлов с использованием FileReader
 * @module components/editor/sidebar/hooks/use-sidebar-file-upload
 */

import { useCallback } from 'react';

/** Тип загружаемого файла: "json" | "python" */
type FileType = "json" | "python";

/**
 * Параметры хука загрузки файлов
 */
export interface UseSidebarFileUploadParams {
  /** Колбэк для установки JSON текста импорта */
  setImportJsonText: (text: string) => void;
  /** Колбэк для установки Python текста импорта */
  setImportPythonText: (text: string) => void;
  /** Колбэк для установки ошибки импорта */
  setImportError: (error: string) => void;
  /** Колбэк для показа toast уведомлений */
  toast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void;
}

/**
 * Результат работы хука загрузки файлов
 */
export interface UseSidebarFileUploadResult {
  /** Функция для загрузки JSON файла */
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Функция для загрузки Python файла */
  handlePythonFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Функция для очистки input после загрузки */
  clearInput: (inputRef: React.RefObject<HTMLInputElement | null>) => void;
}

/**
 * Хук для загрузки файлов в sidebar
 * @param params - Параметры хука с колбэками
 * @returns Объект с функциями загрузки файлов
 */
export function useSidebarFileUpload({
  setImportJsonText,
  setImportPythonText,
  setImportError,
  toast
}: UseSidebarFileUploadParams): UseSidebarFileUploadResult {
  /**
   * Очистить input после загрузки
   * @param inputRef - Реф на input элемент
   */
  const clearInput = useCallback((inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  /**
   * Обработчик загрузки файла
   * @param e - Событие изменения input
   * @param fileType - Тип файла: "json" | "python"
   * @param inputRef - Реф на input для очистки
   */
  const handleFileRead = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      fileType: FileType,
      inputRef: React.RefObject<HTMLInputElement | null>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          
          // Установить текст в зависимости от типа файла
          if (fileType === "json") {
            setImportJsonText(content);
          } else {
            setImportPythonText(content);
          }
          
          setImportError('');
          
          // Показать уведомление об успехе
          toast({
            title: fileType === "json" ? "Файл загружен" : "Python файл загружен",
            description: `Файл "${file.name}" успешно загружен. Нажмите "Импортировать" для создания проекта.`,
          });
        } catch (error) {
          setImportError('Ошибка при чтении файла');
          toast({
            title: "Ошибка загрузки",
            description: "Не удалось прочитать файл",
            variant: "destructive",
          });
        }
      };
      
      reader.onerror = () => {
        setImportError('Ошибка при чтении файла');
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось прочитать файл",
          variant: "destructive",
        });
      };
      
      reader.readAsText(file);
      
      // Очистить input после загрузки
      clearInput(inputRef);
    },
    [setImportJsonText, setImportPythonText, setImportError, toast, clearInput]
  );

  /**
   * Обработчик загрузки JSON файла
   * @param e - Событие изменения input
   */
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileRead(e, "json", { current: null });
    },
    [handleFileRead]
  );

  /**
   * Обработчик загрузки Python файла
   * @param e - Событие изменения input
   */
  const handlePythonFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileRead(e, "python", { current: null });
    },
    [handleFileRead]
  );

  return {
    handleFileUpload,
    handlePythonFileUpload,
    clearInput
  };
}
