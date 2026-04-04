/**
 * @fileoverview Хук обработчика добавления кнопки
 * 
 * Предоставляет функцию для добавления новой кнопки к узлу.
 */

import { generateButtonId } from '@/utils/generate-button-id';
import type { Button, Node } from '@shared/schema';

/** Интерфейс возвращаемого значения хука */
interface UseHandleAddButtonReturn {
  /** Функция добавления кнопки */
  handleAddButton: (nodeId: string) => void;
}

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
 * @returns {UseHandleAddButtonReturn} Объект с функцией добавления
 */
export function useHandleAddButton({
  onButtonAdd
}: UseHandleAddButtonProps): UseHandleAddButtonReturn {
  const handleAddButton = (nodeId: string) => {
    const newButton: Button = {
      id: generateButtonId(),
      text: 'Новая кнопка',
      action: 'goto',
      buttonType: 'normal',
      target: '',
      skipDataCollection: false,
      hideAfterClick: false
    };
    onButtonAdd(nodeId, newButton);
  };

  return {
    handleAddButton
  };
}
