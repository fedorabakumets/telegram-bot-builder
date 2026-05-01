/**
 * @fileoverview Хук определения активных форматов по позиции курсора
 * @description Слушает selectionchange и обходит DOM вверх от курсора,
 * собирая набор активных тегов форматирования.
 * Различает обычную цитату и раскрывающуюся по атрибуту expandable.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Маппинг тегов DOM → команды форматирования.
 * BLOCKQUOTE обрабатывается отдельно — зависит от атрибута expandable.
 */
const TAG_TO_COMMAND: Record<string, string> = {
  'STRONG': 'bold',
  'B': 'bold',
  'EM': 'italic',
  'I': 'italic',
  'U': 'underline',
  'S': 'strikethrough',
  'STRIKE': 'strikethrough',
  'DEL': 'strikethrough',
  'CODE': 'code',
  'PRE': 'codeblock',
  'H3': 'heading',
  'H4': 'heading',
  'H5': 'heading',
  'A': 'link',
  'TG-SPOILER': 'spoiler',
};

/**
 * Хук определения активных форматов по текущей позиции курсора
 * @param editorRef - Ref на DOM элемент редактора
 * @returns Set с командами активных форматов (например: Set{'bold', 'italic'})
 */
export function useActiveFormats(editorRef: React.RefObject<HTMLDivElement>): Set<string> {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const updateActiveFormats = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      setActiveFormats(new Set());
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setActiveFormats(new Set());
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Определяем элемент: если текстовый узел — берём родителя
    const node = container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : container as Element;

    if (!node || !editor.contains(node)) {
      setActiveFormats(new Set());
      return;
    }

    // Обходим DOM вверх от текущего узла до редактора
    const active = new Set<string>();
    let current: Element | null = node;
    while (current && current !== editor) {
      const tag = current.tagName?.toUpperCase();
      if (tag === 'BLOCKQUOTE') {
        // Различаем обычную и раскрывающуюся цитату по атрибуту expandable
        if (current.hasAttribute('expandable')) {
          active.add('expandable-quote');
        } else {
          active.add('quote');
        }
      } else {
        const command = TAG_TO_COMMAND[tag];
        if (command) active.add(command);
      }
      current = current.parentElement;
    }

    setActiveFormats(active);
  }, [editorRef]);

  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveFormats);
    return () => document.removeEventListener('selectionchange', updateActiveFormats);
  }, [updateActiveFormats]);

  return activeFormats;
}
