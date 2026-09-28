/**
 * @fileoverview Связь меню «Обучение» в шапке с обучением на холсте
 * @module components/editor/canvas/learn/editor-learn-bridge
 */

import { useEffect, useState } from 'react';
import type { EditorLearnSectionId } from './editor-learn-sections';

/** Запуск раздела, который регистрирует холст */
let startLearn: ((sectionId: EditorLearnSectionId) => void) | null = null;

/** Подписчики на флаг «обучение идёт» */
const activeListeners = new Set<(active: boolean) => void>();

/** Текущий флаг для новых подписчиков */
let learnActive = false;

/**
 * Холст отдаёт функцию запуска раздела
 * @param start - Запуск раздела с первого шага
 * @returns Снятие регистрации
 */
export function registerEditorLearn(start: (sectionId: EditorLearnSectionId) => void): () => void {
  startLearn = start;
  return () => {
    if (startLearn === start) startLearn = null;
  };
}

/**
 * Меню в шапке просит начать раздел
 * @param sectionId - Раздел обучения
 */
export function requestEditorLearn(sectionId: EditorLearnSectionId): void {
  startLearn?.(sectionId);
}

/**
 * Холст сообщает, идёт ли обучение
 * @param active - Активен ли тур
 */
export function setEditorLearnActive(active: boolean): void {
  learnActive = active;
  activeListeners.forEach((listener) => listener(active));
}

/**
 * Флаг активности обучения для кнопки в шапке
 * @returns true пока тур на холсте открыт
 */
export function useEditorLearnActive(): boolean {
  const [active, setActive] = useState(learnActive);

  useEffect(() => {
    activeListeners.add(setActive);
    setActive(learnActive);
    return () => {
      activeListeners.delete(setActive);
    };
  }, []);

  return active;
}
