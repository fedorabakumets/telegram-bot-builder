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
  /** Флаг активного форматирования */
  isFormatting: boolean;
  /** Функция конвертации значения в HTML */
  valueToHtml: (text: string, enableMarkdown: boolean) => string;
  /** Включена ли поддержка Markdown */
  enableMarkdown: boolean;
}

/**
 * Хук для синхронизации DOM редактора со значением
 * @param options - Параметры хука
 */
export function useEditorSync({
  editorRef,
  value,
  isFormatting,
  valueToHtml,
  enableMarkdown
}: UseEditorSyncOptions): void {
  useEffect(() => {
    if (editorRef.current && !isFormatting) {
      const html = valueToHtml(value, enableMarkdown);
      if (editorRef.current.innerHTML !== html) {
        const selection = window.getSelection();
        let range = null;
        let offset = 0;

        if (selection && selection.rangeCount > 0) {
          try {
            range = selection.getRangeAt(0);
            offset = range.startOffset;
          } catch (e) {
            // Игнорировать ошибки выделения
          }
        }

        editorRef.current.innerHTML = html;

        // Восстановить выделение
        if (range && selection) {
          try {
            const newRange = document.createRange();
            const walker = document.createTreeWalker(
              editorRef.current,
              NodeFilter.SHOW_TEXT,
              null
            );

            let currentOffset = 0;
            let targetNode = null;

            while (walker.nextNode()) {
              const node = walker.currentNode;
              const nodeLength = node.textContent?.length || 0;

              if (currentOffset + nodeLength >= offset) {
                targetNode = node;
                break;
              }
              currentOffset += nodeLength;
            }

            if (targetNode) {
              newRange.setStart(
                targetNode,
                Math.min(offset - currentOffset, targetNode.textContent?.length || 0)
              );
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } catch (e) {
            // Игнорировать ошибки range
          }
        }
      }
    }
  }, [value, valueToHtml, enableMarkdown, isFormatting, editorRef]);
}
