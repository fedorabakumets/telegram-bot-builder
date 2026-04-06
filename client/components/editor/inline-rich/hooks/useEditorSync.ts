/**
 * @fileoverview Хук для синхронизации DOM редактора со значением
 * @description Обновляет innerHTML contenteditable элемента при изменении значения
 */

import { useEffect } from 'react';

/**
 * Параметры хука useEditorSync
 */
export interface UseEditorSyncOptions {
  /** Ref на DOM элемент редактора */
  editorRef: React.RefObject<HTMLDivElement>;
  /** Текущее значение редактора */
  value: string;
  /** Ref флага активного форматирования */
  isFormattingRef: React.RefObject<boolean>;
  /** Функция конвертации значения в HTML */
  valueToHtml: (text: string, enableMarkdown: boolean) => string;
  /** Включена ли поддержка Markdown */
  enableMarkdown: boolean;
}

/**
 * Вычисляет абсолютную позицию курсора относительно всего текстового контента
 * @param container - Корневой DOM-элемент редактора
 * @param node - Узел, в котором находится курсор
 * @param offset - Смещение внутри узла
 * @returns Абсолютная позиция курсора
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
 * Восстанавливает курсор по абсолютной позиции в тексте
 * @param container - Корневой DOM-элемент редактора
 * @param absoluteOffset - Абсолютная позиция курсора
 */
function restoreAbsoluteOffset(container: HTMLElement, absoluteOffset: number): void {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let total = 0;
  while (walker.nextNode()) {
    const len = walker.currentNode.textContent?.length ?? 0;
    if (total + len >= absoluteOffset) {
      const range = document.createRange();
      range.setStart(walker.currentNode, absoluteOffset - total);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    total += len;
  }
}

/**
 * Хук для синхронизации DOM редактора со значением
 * @param options - Параметры хука
 */
export function useEditorSync({
  editorRef,
  value,
  isFormattingRef,
  valueToHtml,
  enableMarkdown
}: UseEditorSyncOptions): void {
  useEffect(() => {
    if (editorRef.current && !isFormattingRef.current) {
      const html = valueToHtml(value, enableMarkdown);
      if (editorRef.current.innerHTML !== html) {
        const selection = window.getSelection();
        let absoluteOffset: number | null = null;

        if (selection && selection.rangeCount > 0) {
          try {
            const range = selection.getRangeAt(0);
            absoluteOffset = getAbsoluteOffset(
              editorRef.current,
              range.startContainer,
              range.startOffset
            );
          } catch {
            // Игнорировать ошибки выделения
          }
        }

        editorRef.current.innerHTML = html;

        if (absoluteOffset !== null && selection) {
          try {
            restoreAbsoluteOffset(editorRef.current, absoluteOffset);
          } catch {
            // Игнорировать ошибки range
          }
        }
      }
    }
  }, [value, valueToHtml, enableMarkdown, editorRef]);
}
