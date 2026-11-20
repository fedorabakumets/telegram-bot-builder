/** @fileoverview Разделение раскрытия строки и самостоятельных действий её элементов. */
import type { MouseEvent } from 'react';
/**
 * Разрешает раскрытие только по свободному месту строки, сохраняя кнопки и выделение текста.
 * @param event - Нажатие на строку или компактную карточку.
 * @returns Нужно ли переключить раскрытие ботов.
 */
export function shouldToggleUserRow(event: Pick<MouseEvent<HTMLElement>, 'target' | 'currentTarget'>): boolean {
  const target = event.target;
  if (!(target instanceof Element) || !event.currentTarget.contains(target)) return false;
  if (target.closest('button,a,input,textarea,select,summary,[role="button"],[role="dialog"],[contenteditable="true"],[data-user-bot-details]')) return false;
  return !window.getSelection()?.toString();
}
