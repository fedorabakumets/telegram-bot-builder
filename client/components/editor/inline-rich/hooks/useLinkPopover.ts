/**
 * @fileoverview Хук управления попапом вставки/редактирования гиперссылки
 * @description Сохраняет выделение, определяет текущую ссылку, применяет и удаляет <a>
 */

import { useRef, useState, useCallback } from 'react';

/**
 * Позиция попапа на экране
 */
export interface PopoverPosition {
  /** Отступ от левого края экрана */
  left: number;
  /** Отступ от верхнего края экрана */
  top: number;
}

/**
 * Результат работы хука useLinkPopover
 */
export interface UseLinkPopoverReturn {
  /** Открыт ли попап */
  isOpen: boolean;
  /** Текущий URL в поле ввода */
  currentUrl: string;
  /** Позиция попапа */
  position: PopoverPosition;
  /** Открыть попап */
  openLinkPopover: () => void;
  /** Применить ссылку */
  applyLink: (url: string) => void;
  /** Удалить ссылку */
  removeLink: () => void;
  /** Закрыть попап */
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
 * Хук управления попапом вставки и редактирования гиперссылки
 * @param onInput - Callback для синхронизации значения редактора после изменений
 * @returns Объект с состоянием и методами попапа
 */
export function useLinkPopover(onInput: () => void): UseLinkPopoverReturn {
  const savedRangeRef = useRef<Range | null>(null);
  const savedAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [position, setPosition] = useState<PopoverPosition>({ left: 0, top: 0 });

  /** Вычисляет позицию попапа над выделением или над кнопкой */
  const calcPosition = useCallback((rect: DOMRect): PopoverPosition => {
    const POPUP_HEIGHT = 48;
    const MARGIN = 8;
    return {
      left: Math.max(8, rect.left + window.scrollX),
      top: rect.top + window.scrollY - POPUP_HEIGHT - MARGIN
    };
  }, []);

  const openLinkPopover = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    savedRangeRef.current = range.cloneRange();

    // Если выделение пустое — проверяем, стоит ли курсор внутри <a>
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

    // Позиционируем попап
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) {
      setPosition(calcPosition(rect));
    }

    setIsOpen(true);
  }, [calcPosition]);

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

  const removeLink = useCallback(() => {
    const anchorEl = savedAnchorRef.current;
    if (anchorEl) {
      const textNode = document.createTextNode(anchorEl.textContent ?? '');
      anchorEl.parentNode?.replaceChild(textNode, anchorEl);
      setTimeout(onInput, 0);
    }
    setIsOpen(false);
  }, [onInput]);

  const closeLinkPopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    currentUrl,
    position,
    openLinkPopover,
    applyLink,
    removeLink,
    closeLinkPopover
  };
}
