/**
 * @fileoverview Хук управления языком блока кода <pre>
 * @description Отслеживает позицию курсора внутри <pre>, читает и применяет
 * класс language-XXX к вложенному <code>. Аналог useLinkPopover для ссылок.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Результат работы хука useCodeLanguage
 */
export interface UseCodeLanguageReturn {
  /** Курсор находится внутри блока <pre> */
  isOpen: boolean;
  /** Текущий язык (пустая строка если не задан) */
  currentLanguage: string;
  /** Применить язык к текущему блоку <pre> */
  applyLanguage: (lang: string) => void;
  /** Удалить языковую обёртку <code> из блока <pre> */
  removeLanguage: () => void;
  /** Ref для контейнера CodeLanguageRow — предотвращает закрытие при фокусе на нём */
  rowRef: React.RefObject<HTMLDivElement>;
}

/**
 * Находит ближайший элемент <pre> вверх по DOM-дереву
 * @param node - Начальный узел
 * @returns Элемент <pre> или null
 */
function getPreElement(node: Node | null): HTMLElement | null {
  while (node) {
    if ((node as Element).tagName === 'PRE') return node as HTMLElement;
    node = node.parentNode;
  }
  return null;
}

/**
 * Извлекает язык из первого дочернего <code class="language-XXX">
 * @param pre - Элемент <pre>
 * @returns Название языка или пустая строка
 */
function readLanguageFromPre(pre: HTMLElement): string {
  const code = pre.querySelector('code[class*="language-"]');
  if (!code) return '';
  const match = code.className.match(/language-(\S+)/);
  return match ? match[1] : '';
}

/**
 * Хук управления языком блока кода
 * @param editorRef - Ref на DOM-элемент редактора
 * @param onInput - Callback синхронизации после изменений
 * @returns Объект с состоянием и методами управления языком
 */
export function useCodeLanguage(
  editorRef: React.RefObject<HTMLElement>,
  onInput: () => void
): UseCodeLanguageReturn {
  /** Открыта ли строка ввода языка */
  const [isOpen, setIsOpen] = useState(false);
  /** Текущий язык блока */
  const [currentLanguage, setCurrentLanguage] = useState('');
  /** Ref на DOM-контейнер CodeLanguageRow — нужен чтобы не закрывать при фокусе на нём */
  const rowRef = useRef<HTMLDivElement>(null);
  /** Сохранённый <pre> элемент — используется в applyLanguage после потери выделения */
  const savedPreRef = useRef<HTMLElement | null>(null);

  /** Обновляет состояние при изменении выделения */
  const handleSelectionChange = useCallback(() => {
    // Если фокус находится внутри строки ввода языка — не закрываем
    if (rowRef.current && rowRef.current.contains(document.activeElement)) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setIsOpen(false);
      return;
    }
    const range = selection.getRangeAt(0);
    const pre = getPreElement(range.commonAncestorContainer);

    if (pre && editorRef.current?.contains(pre)) {
      savedPreRef.current = pre;
      setCurrentLanguage(readLanguageFromPre(pre));
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setCurrentLanguage('');
    }
  }, [editorRef]);

  /** Подписываемся на selectionchange для отслеживания позиции курсора */
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  /**
   * Применяет язык к текущему блоку <pre>.
   * Использует savedPreRef если выделение уже потеряно (фокус на поле ввода).
   * @param lang - Название языка (пустая строка — удаляет обёртку)
   */
  const applyLanguage = useCallback((lang: string) => {
    // Пробуем получить <pre> из текущего выделения, иначе из сохранённого ref
    const selection = window.getSelection();
    let pre: HTMLElement | null = null;
    if (selection && selection.rangeCount > 0) {
      pre = getPreElement(selection.getRangeAt(0).commonAncestorContainer);
    }
    if (!pre) pre = savedPreRef.current;
    if (!pre) return;

    const trimmed = lang.trim();

    if (!trimmed) {
      const code = pre.querySelector('code');
      if (code) {
        const text = code.textContent ?? '';
        code.replaceWith(document.createTextNode(text));
      }
      setCurrentLanguage('');
    } else {
      const existingCode = pre.querySelector('code');
      if (existingCode) {
        existingCode.className = `language-${trimmed}`;
      } else {
        const code = document.createElement('code');
        code.className = `language-${trimmed}`;
        code.innerHTML = pre.innerHTML;
        pre.innerHTML = '';
        pre.appendChild(code);
      }
      setCurrentLanguage(trimmed);
    }

    setTimeout(onInput, 0);
  }, [onInput]);

  /**
   * Удаляет языковую обёртку <code> из блока <pre>
   */
  const removeLanguage = useCallback(() => {
    applyLanguage('');
  }, [applyLanguage]);

  return { isOpen, currentLanguage, applyLanguage, removeLanguage, rowRef };
}
