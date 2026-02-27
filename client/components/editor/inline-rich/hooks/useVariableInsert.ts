/**
 * @fileoverview Хук для вставки переменных в текст редактора
 * @description Вставляет переменные вида {variableName} в позицию курсора
 */

import { useCallback, RefObject } from 'react';
import type { Variable } from '../types';

/**
 * Параметры хука useVariableInsert
 */
export interface UseVariableInsertOptions {
  /** Ref на DOM элемент редактора */
  editorRef: RefObject<HTMLDivElement | null>;
  /** Массив доступных переменных */
  availableVariables: Variable[];
  /** Функция сохранения в стек отмены */
  saveToUndoStack: () => void;
  /** Функция обработки ввода */
  handleInput: () => void;
  /** Функция для показа уведомлений */
  toast: (options: { title: string; description: string; variant: string }) => void;
  /** Callback при выборе медиапеременной */
  onMediaVariableSelect?: (variableName: string, mediaType: string) => void;
  /** Флаг установки форматирования */
  setIsFormatting: (value: boolean) => void;
}

/**
 * Хук для вставки переменных в текст
 * @param options - Параметры хука
 * @returns Функция insertVariable для вставки переменной
 */
export function useVariableInsert({
  editorRef,
  availableVariables,
  saveToUndoStack,
  handleInput,
  toast,
  onMediaVariableSelect,
  setIsFormatting
}: UseVariableInsertOptions) {
  const insertVariable = useCallback((variableName: string) => {
    const variable = availableVariables.find(v => v.name === variableName);
    const isMediaVariable = variable?.mediaType !== undefined;

    if (isMediaVariable && onMediaVariableSelect && variable) {
      onMediaVariableSelect(variableName, variable.mediaType);
      toast({
        title: "Медиа прикреплено",
        description: `Медиафайл "${variableName}" добавлен в прикрепленные медиа`,
        variant: "default"
      });
      return;
    }

    if (!editorRef.current) return;

    saveToUndoStack();
    setIsFormatting(true);

    const selection = window.getSelection();
    if (!selection) {
      setIsFormatting(false);
      return;
    }

    try {
      let range: Range;

      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else {
        range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }

      const variableText = `{${variableName}}`;
      const textNode = document.createTextNode(variableText);

      range.deleteContents();
      range.insertNode(textNode);

      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      setTimeout(() => {
        handleInput();
        toast({
          title: "Переменная добавлена",
          description: `Переменная "${variableName}" вставлена в текст`,
          variant: "default"
        });
      }, 0);
    } catch (e) {
      toast({
        title: "Ошибка",
        description: "Не удалось вставить переменную",
        variant: "destructive"
      });
    }

    setTimeout(() => setIsFormatting(false), 100);
  }, [editorRef, availableVariables, saveToUndoStack, handleInput, toast, onMediaVariableSelect, setIsFormatting]);

  return { insertVariable };
}
