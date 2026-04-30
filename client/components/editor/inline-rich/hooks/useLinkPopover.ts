/**
 * @fileoverview Хук управления inline-строкой вставки/редактирования гиперссылки
 * @description Сохраняет выделение, определяет текущую ссылку, применяет и удаляет <a>
 */

import { useRef, useState, useCallback } from 'react';

/**
 * Результат работы хука useLinkPopover
 */
export interface UseLinkPopoverReturn {
  /** Открыта ли строка ввода */
  isOpen: boolean;
  /** Текущий URL в поле ввода */
  currentUrl: string;
  /** Открыть строку ввода */
  openLinkPopover: () => void;
  /** Применить ссылку */
  applyLink: (url: string) => void;
  /** Удалить ссылку */
  removeLink: () => void;
  /** Закрыть строку ввода */
  closeLinkPopover: () => void;
}

/**
 * Находит ближайший элемент <a> вверх по DOM-дереву
 * @param node - Начальный узел
 * @returns Элемент <a> или null
 */
function getAnchorElement(node: Node | null): HTMLAnchorElement | null {
  while (node) {
    if (node.nodeName === 'A') return node as HTMLAnchorElement;
    node = node.parentNode;
  }
  return null;
}

/**
 * Хук управления inline-строкой вставки и редактирования гиперссылки
 * @param onInput - Callback для синхронизации значения редактора после изменений
 * @returns Объект с состоянием и методами строки ввода
 */
export function useLinkPopover(onInput: () => void): UseLinkPopoverReturn {
  /** Сохранённый Range выделения на момент открытия */
  const savedRangeRef = useRef<Range | null>(null);
  /** Сохранённый элемент <a> если курсор стоял внутри ссылки */
  const savedAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  /**
   * Открывает строку ввода, сохраняя текущее выделение и URL существующей ссылки
   */
  const openLinkPopover = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      savedRangeRef.current = null;
      savedAnchorRef.current = null;
      setCurrentUrl('');
      setIsOpen(true);
      return;
    }

    const range = selection.getRangeAt(0);
    savedRangeRef.current = range.cloneRange();

    // Если курсор стоит внутри <a> — подставляем её href
    const anchorEl = getAnchorElement(range.commonAncestorContainer);
    if (anchorEl) {
      savedAnchorRef.current = anchorEl;
      // Выделяем весь текст ссылки если выделение пустое
      if (range.collapsed) {
        const fullRange = document.createRange();
        fullRange.selectNodeContents(anchorEl);
        savedRangeRef.current = fullRange.cloneRange();
      }
      setCurrentUrl(anchorEl.getAttribute('href') ?? '');
    } else {
      savedAnchorRef.current = null;
      setCurrentUrl('');
    }

    setIsOpen(true);
  }, []);

  /**
   * Применяет введённый URL: создаёт новую ссылку или обновляет существующую
   * @param url - URL для вставки
   */
  const applyLink = useCallback((url: string) => {
    const range = savedRangeRef.current;
    if (!range || !url.trim()) {
      setIsOpen(false);
      return;
    }

    // Восстанавливаем выделение
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const selectedText = range.toString();

    // Если курсор был внутри существующей ссылки — обновляем href
    if (savedAnchorRef.current) {
      savedAnchorRef.current.href = url;
    } else {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.textContent = selectedText || url;
      range.deleteContents();
      range.insertNode(anchor);
    }

    setIsOpen(false);
    setTimeout(onInput, 0);
  }, [onInput]);

  /**
   * Удаляет ссылку, заменяя <a> на текстовый узел
   */
  const removeLink = useCallback(() => {
    const anchorEl = savedAnchorRef.current;
    if (anchorEl) {
      const textNode = document.createTextNode(anchorEl.textContent ?? '');
      anchorEl.parentNode?.replaceChild(textNode, anchorEl);
      setTimeout(onInput, 0);
    }
    setIsOpen(false);
  }, [onInput]);

  /**
   * Закрывает строку ввода без применения изменений
   */
  const closeLinkPopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    currentUrl,
    openLinkPopover,
    applyLink,
    removeLink,
    closeLinkPopover
  };
}
