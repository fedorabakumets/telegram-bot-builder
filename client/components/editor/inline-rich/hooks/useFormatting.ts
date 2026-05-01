/**
 * @fileoverview Хук для применения форматирования к тексту
 * @description Обрабатывает применение стилей с поддержкой toggle:
 * повторное нажатие на активный формат снимает его.
 * Сохраняет выделение по абсолютным текстовым позициям, чтобы после
 * ре-рендера DOM (useEditorSync) Range оставался валидным.
 */

import { useCallback, useRef } from 'react';
import type { FormatOption } from '../format-options';
import type { ToastFn } from '../utils/toast-types';

/**
 * Абсолютные текстовые позиции выделения (инвариантны к пересозданию DOM)
 */
interface SavedSelection {
  /** Начало выделения в тексте редактора */
  start: number;
  /** Конец выделения в тексте редактора */
  end: number;
}

/**
 * Вычисляет абсолютную позицию узла+смещения в тексте редактора
 * @param container - Корневой элемент редактора
 * @param node - Узел курсора
 * @param offset - Смещение внутри узла
 * @returns Абсолютная позиция в тексте
 */
function getAbsoluteOffset(container: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let total = 0;
  while (walker.nextNode()) {
    if (walker.currentNode === node) return total + offset;
    total += walker.currentNode.textContent?.length ?? 0;
  }
  return total;
}

/**
 * Восстанавливает Range по абсолютным позициям в тексте редактора
 * @param container - Корневой элемент редактора
 * @param start - Начало выделения
 * @param end - Конец выделения
 * @returns Восстановленный Range или null
 */
function restoreRangeByOffsets(
  container: HTMLElement,
  start: number,
  end: number
): Range | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let total = 0;
  let startNode: Node | null = null;
  let startOff = 0;
  let endNode: Node | null = null;
  let endOff = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const len = node.textContent?.length ?? 0;

    if (!startNode && total + len >= start) {
      startNode = node;
      startOff = start - total;
    }
    if (!endNode && total + len >= end) {
      endNode = node;
      endOff = end - total;
    }
    if (startNode && endNode) break;
    total += len;
  }

  if (!startNode || !endNode) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
    return range;
  } catch {
    return null;
  }
}

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
 * @returns Функция applyFormatting и обработчик onBlur для сохранения выделения
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
  /**
   * Сохранённое выделение в виде абсолютных текстовых позиций.
   * Инвариантно к пересозданию DOM при ре-рендере React.
   */
  const savedSelectionRef = useRef<SavedSelection | null>(null);

  /**
   * Сохраняет текущее выделение при потере фокуса редактором.
   * Вызывается из onBlur contenteditable div.
   */
  const saveSelectionOnBlur = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    try {
      const range = selection.getRangeAt(0);
      const start = getAbsoluteOffset(editor, range.startContainer, range.startOffset);
      const end = getAbsoluteOffset(editor, range.endContainer, range.endOffset);
      savedSelectionRef.current = { start, end };
    } catch {
      // Игнорируем ошибки при сохранении
    }
  }, [editorRef]);

  /**
   * Восстанавливает сохранённое выделение по абсолютным позициям.
   * Работает корректно даже после пересоздания DOM.
   * @returns Range или null если нет сохранённого выделения
   */
  const restoreSavedRange = useCallback((): Range | null => {
    const editor = editorRef.current;
    const saved = savedSelectionRef.current;
    if (!editor || !saved) return null;

    const range = restoreRangeByOffsets(editor, saved.start, saved.end);
    if (!range) return null;

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    return range;
  }, [editorRef]);

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

    // Пробуем получить текущее выделение, если нет — восстанавливаем сохранённое
    let selection = window.getSelection();
    let range: Range | null = null;

    if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
      range = selection.getRangeAt(0);
    } else {
      // Фокус ушёл на кнопку — восстанавливаем сохранённый Range
      range = restoreSavedRange();
      selection = window.getSelection();
    }

    if (!range || !selection) {
      toast({
        title: "Нет выделения",
        description: "Выделите текст для форматирования или поставьте курсор в нужное место",
        variant: "default"
      });
      setIsFormatting(false);
      return;
    }

    try {
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
        // Обновляем сохранённый Range после изменения
        if (selection.rangeCount > 0) {
          savedRangeRef.current = selection.getRangeAt(0).cloneRange();
        }
      }

      // isFormattingRef уже true — handleInput вызовет onChange,
      // useEditorSync увидит флаг и не перезапишет DOM
      setTimeout(() => { handleInput(); }, 0);
    } catch (e) {
      toast({
        title: "Ошибка форматирования",
        description: "Не удалось применить форматирование",
        variant: "destructive"
      });
    }

    // Держим флаг форматирования дольше чтобы useEditorSync не перезаписал DOM
    // пока React не обработает новый value
    setTimeout(() => setIsFormatting(false), 200);
  }, [editorRef, saveToUndoStack, handleInput, toast, onFormatModeChange, setIsFormatting, onLinkCommand, restoreSavedRange]);

  return { applyFormatting, saveSelectionOnBlur };
}
