/**
 * @fileoverview Хук для применения форматирования к тексту
 * @description Обрабатывает применение стилей (жирный, курсив и т.д.) к выделенному тексту
 */

import { useCallback, RefObject } from 'react';
import type { FormatOption } from '../format-options';

/**
 * Параметры хука useFormatting
 */
export interface UseFormattingOptions {
  /** Ref на DOM элемент редактора */
  editorRef: RefObject<HTMLDivElement | null>;
  /** Функция сохранения в стек отмены */
  saveToUndoStack: () => void;
  /** Функция обработки ввода */
  handleInput: () => void;
  /** Функция для показа уведомлений */
  toast: (options: { title: string; description: string; variant: string }) => void;
  /** Callback при изменении режима форматирования */
  onFormatModeChange?: (formatMode: 'html' | 'markdown' | 'none') => void;
  /** Флаг установки форматирования */
  setIsFormatting: (value: boolean) => void;
}

/**
 * Хук для применения форматирования к выделенному тексту
 * @param options - Параметры хука
 * @returns Функция applyFormatting для применения форматирования
 */
export function useFormatting({
  editorRef,
  saveToUndoStack,
  handleInput,
  toast,
  onFormatModeChange,
  setIsFormatting
}: UseFormattingOptions) {
  const applyFormatting = useCallback((format: FormatOption) => {
    if (!editorRef.current) return;

    saveToUndoStack();
    setIsFormatting(true);

    if (onFormatModeChange) {
      onFormatModeChange('html');
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      toast({
        title: "Нет выделения",
        description: "Выделите текст для форматирования или поставьте курсор в нужное место",
        variant: "default"
      });
      setIsFormatting(false);
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      if (['bold', 'italic', 'underline', 'strikethrough'].includes(format.command)) {
        document.execCommand(format.command, false, undefined);
      } else if (format.command === 'code' && selectedText) {
        const codeElement = document.createElement('code');
        codeElement.textContent = selectedText;
        range.deleteContents();
        range.insertNode(codeElement);
        range.selectNode(codeElement);
        selection.removeAllRanges();
        selection.addRange(range);
      } else if (format.command === 'quote' && selectedText) {
        const quoteElement = document.createElement('blockquote');
        quoteElement.textContent = selectedText;
        range.deleteContents();
        range.insertNode(quoteElement);
        range.selectNode(quoteElement);
        selection.removeAllRanges();
        selection.addRange(range);
      } else if (format.command === 'heading' && selectedText) {
        const headingElement = document.createElement('h3');
        headingElement.textContent = selectedText;
        range.deleteContents();
        range.insertNode(headingElement);
        range.selectNode(headingElement);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      setTimeout(() => {
        handleInput();
        toast({
          title: "Форматирование применено",
          description: `${format.name} применен к выделенному тексту`,
          variant: "default"
        });
      }, 0);
    } catch (e) {
      toast({
        title: "Ошибка форматирования",
        description: "Не удалось применить форматирование",
        variant: "destructive"
      });
    }

    setTimeout(() => setIsFormatting(false), 100);
  }, [editorRef, saveToUndoStack, handleInput, toast, onFormatModeChange, setIsFormatting]);

  return { applyFormatting };
}
