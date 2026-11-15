/**
 * @fileoverview Хук для копирования форматированного текста в буфер обмена
 * @description Копирует HTML содержимое редактора в clipboard
 */

import { useCallback, RefObject } from 'react';
import type { ToastFn } from '../utils/toast-types';
import { copyRichHtml } from '../utils/copy-rich-html';

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

    copyRichHtml(editorRef.current.innerHTML).then((formatted) => {
      toast({
        title: "Скопировано",
        description: formatted ? "Форматированный текст скопирован в буфер обмена" : "Текст скопирован без форматирования",
        variant: "default"
      });
    }).catch(() => {
      toast({ title: "Не удалось скопировать", description: "Разрешите доступ к буферу обмена и повторите попытку", variant: "destructive" });
    });
  }, [editorRef, toast]);

  return { copyFormatted };
}
