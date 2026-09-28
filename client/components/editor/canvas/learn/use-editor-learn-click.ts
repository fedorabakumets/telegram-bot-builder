/**
 * @fileoverview Засчитывает задание шага по нажатию нужной кнопки
 * @module components/editor/canvas/learn/use-editor-learn-click
 */

import { useEffect, useState } from 'react';

/**
 * Следит за нажатием на кнопку шага
 * @param stepKey - Ключ шага: сбрасывает отметку при смене шага
 * @param clickTarget - CSS-селектор кнопки или пусто
 * @returns true после нажатия на кнопку на этом шаге
 */
export function useEditorLearnClick(stepKey: string, clickTarget?: string): boolean {
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (!clickTarget) {
      setClicked(false);
      return;
    }
    const button = document.querySelector(clickTarget);
    setClicked(button instanceof HTMLButtonElement && button.disabled);
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(clickTarget)) setClicked(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [stepKey, clickTarget]);

  return clicked;
}
