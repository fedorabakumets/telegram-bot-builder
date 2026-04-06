/**
 * @fileoverview Хук для копирования форматированного текста в буфер обмена
 * @description Копирует HTML содержимое редактора в clipboard
 */

import { useCallback, RefObject } from 'react';
import type { ToastFn } from '../utils/toast-types';

/**
 * Параметры хука useClipboard
 */
export interface UseClipboardOptions {
  /** Ref на DOM элемент редактора */
  editorRef: RefObject<HTMLDivElement>;
  /** Функция для показа уведомлений */
  toast: ToastFn;
}

/**
 * Хук для копирования форматированного текста в буфер обмена
 * @param options - Параметры хука
 * @returns Функция copyFormatted для копирования
 */
export function useClipboard({
  editorRef,
  toast
}: UseClipboardOptions) {
  const copyFormatted = useCallback(() => {
    if (!editorRef.current) return;

    const html = editorRef.current.innerHTML;
    navigator.clipboard.writeText(html).then(() => {
      toast({
        title: "Скопировано",
        description: "Форматированный текст скопирован в буфер обмена",
        variant: "default"
      });
    });
  }, [editorRef, toast]);

  return { copyFormatted };
}
