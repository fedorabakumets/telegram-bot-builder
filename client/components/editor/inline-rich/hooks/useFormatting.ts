/**
 * @fileoverview Хук для применения форматирования к тексту
 * @description Обрабатывает применение стилей (жирный, курсив и т.д.) к выделенному тексту
 */

import { useCallback } from 'react';
import type { FormatOption } from '../format-options';
import type { ToastFn } from '../utils/toast-types';

/**
 * Параметры хука useFormatting
 */
export interface UseFormattingOptions {
  /** Ref на DOM элемент редактора */
  editorRef: React.RefObject<HTMLDivElement>;
  /** Функция сохранения в стек отмены */
  saveToUndoStack: () => void;
  /** Функция обработки ввода */
  handleInput: () => void;
  /** Функция для показа уведомлений */
  toast: ToastFn;
  /** Callback при изменении режима форматирования */
  onFormatModeChange?: (formatMode: 'html' | 'markdown' | 'none') => void;
  /** Флаг установки форматирования */
  setIsFormatting: (value: boolean) => void;
  /** Callback для открытия попапа вставки ссылки */
  onLinkCommand?: () => void;
}

/**
 * Оборачивает выделенный текст в HTML-тег
 * @param tagName - Имя тега для оборачивания
 */
function wrapSelection(tagName: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;
  const el = document.createElement(tagName);
  el.textContent = selectedText;
  range.deleteContents();
  range.insertNode(el);
  range.selectNode(el);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Маппинг команд форматирования на HTML-теги */
const FORMAT_TAG_MAP: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strikethrough: 's'
};

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
  setIsFormatting,
  onLinkCommand
}: UseFormattingOptions) {
  const applyFormatting = useCallback((format: FormatOption) => {
    if (!editorRef.current) return;

    // Команда ссылки делегируется внешнему попапу
    if (format.command === 'link') {
      onLinkCommand?.();
      return;
    }

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

      const tagName = FORMAT_TAG_MAP[format.command];
      if (tagName) {
        wrapSelection(tagName);
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
      } else if (format.command === 'spoiler' && selectedText) {
        /**
         * Toggle спойлера:
         * - если выделение внутри <tg-spoiler> → снимаем тег
         * - иначе → оборачиваем в <tg-spoiler>
         */
        const ancestor = range.commonAncestorContainer;
        const existingSpoiler: Element | null =
          ancestor.nodeName === 'TG-SPOILER'
            ? (ancestor as Element)
            : (ancestor as Element).closest?.('tg-spoiler') ??
              (ancestor.parentElement?.closest('tg-spoiler') ?? null);

        if (existingSpoiler) {
          // Снимаем спойлер: заменяем <tg-spoiler> его текстовым содержимым
          const text = existingSpoiler.textContent ?? '';
          const textNode = document.createTextNode(text);
          existingSpoiler.parentNode?.replaceChild(textNode, existingSpoiler);
          // Восстанавливаем выделение на том же тексте
          const newRange = document.createRange();
          newRange.selectNode(textNode);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          // Оборачиваем выделенный текст в Telegram-тег спойлера
          const spoilerElement = document.createElement('tg-spoiler');
          spoilerElement.textContent = selectedText;
          range.deleteContents();
          range.insertNode(spoilerElement);
          range.selectNode(spoilerElement);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      setTimeout(() => {
        handleInput();
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
