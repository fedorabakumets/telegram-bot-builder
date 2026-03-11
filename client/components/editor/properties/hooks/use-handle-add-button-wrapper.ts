/**
 * @fileoverview Хук обработчика добавления кнопки
 * 
 * Предоставляет функцию для добавления новой кнопки к узлу.
 */

import { nanoid } from 'nanoid';
import type { Button, Node } from '@shared/schema';

/** Пропсы хука */
interface UseHandleAddButtonProps {
  /** Выбранный узел */
  selectedNode: Node | null;
  /** Функция добавления кнопки к узлу */
  onButtonAdd: (nodeId: string, button: Button) => void;
}

/**
 * Хук обработчика добавления кнопки
 * 
 * @param {UseHandleAddButtonProps} props - Пропсы хука
 * @returns {() => void} Функция добавления кнопки
 */
export function useHandleAddButton({
  selectedNode,
  onButtonAdd
}: UseHandleAddButtonProps): () => void {
  return () => {
    if (!selectedNode) return;

    const newButton: Button = {
      id: nanoid(),
      text: 'Новая кнопка',
      action: 'goto',
      buttonType: 'normal',
      target: '',
      skipDataCollection: false,
      hideAfterClick: false
    };
    onButtonAdd(selectedNode.id, newButton);
  };
}
