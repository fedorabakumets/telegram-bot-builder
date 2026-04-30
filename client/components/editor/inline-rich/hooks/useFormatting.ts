/**
 * @fileoverview Хук для применения форматирования к тексту
 * @description Обрабатывает применение стилей с поддержкой toggle:
 * повторное нажатие на активный формат снимает его.
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
 * Маппинг команд форматирования на HTML-теги для оборачивания
 */
const FORMAT_TAG_MAP: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strikethrough: 's',
  code: 'code',
  quote: 'blockquote',
  heading: 'h3',
  spoiler: 'tg-spoiler',
};

/**
 * Маппинг команд на теги для поиска существующего форматирования (включая алиасы)
 * Используется при toggle — нужно найти любой вариант тега
 */
const COMMAND_TO_TAGS: Record<string, string[]> = {
  bold: ['strong', 'b'],
  italic: ['em', 'i'],
  underline: ['u'],
  strikethrough: ['s', 'strike', 'del'],
  code: ['code', 'pre'],
  quote: ['blockquote'],
  heading: ['h3', 'h4', 'h5'],
  spoiler: ['tg-spoiler'],
};

/**
 * Ищет ближайший родительский элемент с одним из указанных тегов
 * @param node - Начальный узел
 * @param tagNames - Список имён тегов (в нижнем регистре)
 * @param editor - Корневой элемент редактора (граница поиска)
 * @returns Найденный элемент или null
 */
function findAncestorByTags(
  node: Node | null,
  tagNames: string[],
  editor: HTMLElement
): Element | null {
  let current = node?.nodeType === Node.TEXT_NODE
    ? node.parentElement
    : node as Element | null;

  while (current && current !== editor) {
    if (tagNames.includes(current.tagName.toLowerCase())) return current;
    current = current.parentElement;
  }
  return null;
}

/**
 * Снимает форматирование: заменяет элемент его текстовым содержимым
 * и восстанавливает выделение на этом тексте.
 * @param el - Элемент для удаления
 * @param selection - Текущее выделение
 */
function unwrapElement(el: Element, selection: Selection): void {
  const text = el.textContent ?? '';
  const textNode = document.createTextNode(text);
  el.parentNode?.replaceChild(textNode, el);
  const newRange = document.createRange();
  newRange.selectNode(textNode);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

/**
 * Оборачивает выделенный текст в новый элемент с указанным тегом
 * и восстанавливает выделение на нём.
 * @param tagName - Имя тега
 * @param selectedText - Выделенный текст
 * @param range - Текущий Range
 * @param selection - Текущее выделение
 */
function wrapWithTag(
  tagName: string,
  selectedText: string,
  range: Range,
  selection: Selection
): void {
  const el = document.createElement(tagName);
  el.textContent = selectedText;
  range.deleteContents();
  range.insertNode(el);
  range.selectNode(el);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Хук для применения форматирования к выделенному тексту с поддержкой toggle
 * @param options - Параметры хука
 * @returns Функция applyFormatting для применения/снятия форматирования
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
      const editor = editorRef.current;

      const tagName = FORMAT_TAG_MAP[format.command];
      const searchTags = COMMAND_TO_TAGS[format.command];

      if (tagName && searchTags) {
        // Ищем существующий родительский элемент с этим форматом
        const existing = findAncestorByTags(
          range.commonAncestorContainer,
          searchTags,
          editor
        );

        if (existing) {
          // Toggle OFF — снимаем форматирование
          unwrapElement(existing, selection);
        } else if (selectedText) {
          // Toggle ON — оборачиваем выделенный текст
          wrapWithTag(tagName, selectedText, range, selection);
        }
      }

      setTimeout(() => { handleInput(); }, 0);
    } catch (e) {
      toast({
        title: "Ошибка форматирования",
        description: "Не удалось применить форматирование",
        variant: "destructive"
      });
    }

    setTimeout(() => setIsFormatting(false), 100);
  }, [editorRef, saveToUndoStack, handleInput, toast, onFormatModeChange, setIsFormatting, onLinkCommand]);

  return { applyFormatting };
}
