/**
 * @fileoverview Хук для обработки ввода в редакторе
 * @description Конвертирует HTML из contenteditable в значение и вызывает onChange
 */

import { useCallback, RefObject } from 'react';

/**
 * Параметры хука useEditorInput
 */
export interface UseEditorInputOptions {
  /** Ref на DOM элемент редактора */
  editorRef: RefObject<HTMLDivElement | null>;
  /** Функция конвертации HTML в значение */
  htmlToValue: (html: string, enableMarkdown: boolean) => string;
  /** Функция обратного вызова при изменении значения */
  onChange: (value: string) => void;
  /** Включена ли поддержка Markdown */
  enableMarkdown: boolean;
  /** Флаг установки форматирования */
  setIsFormatting: (value: boolean) => void;
}

/**
 * Хук для обработки ввода в редакторе
 * @param options - Параметры хука
 * @returns Обработчик handleInput для contenteditable элемента
 */
export function useEditorInput({
  editorRef,
  htmlToValue,
  onChange,
  enableMarkdown,
  setIsFormatting
}: UseEditorInputOptions) {
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    setIsFormatting(true);
    const html = editorRef.current.innerHTML;
    const text = htmlToValue(html, enableMarkdown);
    onChange(text);
    // Сбрасываем флаг через requestAnimationFrame — после того как React
    // обработает новый value и useEditorSync пропустит перезапись DOM
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsFormatting(false));
    });
  }, [editorRef, htmlToValue, onChange, enableMarkdown, setIsFormatting]);

  return { handleInput };
}
