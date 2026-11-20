/** @fileoverview Подсветка буквального совпадения без изменения HTML и ссылок сообщения. */
import { Children, cloneElement, isValidElement, type ReactNode } from 'react';

/**
 * Выделяет найденные слова внутри уже безопасно разобранного форматированного текста.
 * @param content - Дерево текста и элементов форматирования
 * @param query - Буквальная поисковая фраза
 * @returns Текст с мягкой подсветкой совпадений
 */
export function highlightMessageText(content: ReactNode, query: string): ReactNode {
  if (!query) return content;
  const pattern = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return Children.map(content, child => {
    if (typeof child === 'string') return child.split(pattern).map((part, index) => index % 2
      ? <mark key={index} className="rounded-sm bg-amber-300/30 text-inherit">{part}</mark> : part);
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children !== undefined) {
      return cloneElement(child, undefined, highlightMessageText(child.props.children, query));
    }
    return child;
  });
}
