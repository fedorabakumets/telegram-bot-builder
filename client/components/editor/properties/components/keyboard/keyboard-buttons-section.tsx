/**
 * @fileoverview Кнопки добавления кнопок клавиатуры
 *
 * Компонент отображает кнопки для добавления новых кнопок.
 */

import { Button } from '@/components/ui/button';
import type { Node, Button as ButtonType } from '@shared/schema';

/** Пропсы компонента */
interface KeyboardButtonsSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция добавления кнопки */
  onButtonAdd: (nodeId: string, button: ButtonType) => void;
}

/**
 * Компонент кнопок добавления
 *
 * @param {KeyboardButtonsSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Кнопки добавления
 */
export function KeyboardButtonsSection({
  selectedNode,
  onButtonAdd
}: KeyboardButtonsSectionProps) {
  const handleAddOptionButton = () => {
    const newButton: ButtonType = {
      id: Date.now().toString(),
      text: 'Новая опция',
      action: 'selection' as const,
      target: '',
      skipDataCollection: false,
      hideAfterClick: false
    };
    const currentButtons = selectedNode.data.buttons || [];
    const updatedButtons = [...currentButtons, newButton];
    onButtonAdd(selectedNode.id, updatedButtons[updatedButtons.length - 1]);
  };

  const handleAddCompleteButton = () => {
    const newButton: ButtonType = {
      id: Date.now().toString(),
      text: 'Готово',
      action: 'complete' as const,
      target: '',
      skipDataCollection: false,
      hideAfterClick: false
    };
    const currentButtons = selectedNode.data.buttons || [];
    const updatedButtons = [...currentButtons, newButton];
    onButtonAdd(selectedNode.id, updatedButtons[updatedButtons.length - 1]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onButtonAdd(selectedNode.id, {
          id: Date.now().toString(),
          text: 'Новая кнопка',
          action: 'goto',
          target: '',
          skipDataCollection: false,
          hideAfterClick: false
        })}
        className="h-8 px-2 sm:px-3 border-orange-300/50 dark:border-orange-700/50 text-orange-700 dark:text-orange-300 hover:bg-orange-100/50 dark:hover:bg-orange-900/30"
        title="Добавить кнопку"
      >
        <i className="fas fa-plus text-xs"></i>
        <span className="ml-1.5 hidden sm:inline text-xs font-medium">Кнопка</span>
      </Button>
      {selectedNode.data.allowMultipleSelection && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddOptionButton}
            className="h-8 px-2 sm:px-3 border-green-300/50 dark:border-green-700/50 text-green-700 dark:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-900/30"
            title="Добавить опцию"
          >
            <i className="fas fa-check text-xs"></i>
            <span className="ml-1.5 hidden sm:inline text-xs font-medium">Опция</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddCompleteButton}
            className="h-8 px-2 sm:px-3 border-purple-300/50 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/30"
            title="Добавить завершение"
          >
            <i className="fas fa-flag-checkered text-xs"></i>
            <span className="ml-1.5 hidden sm:inline text-xs font-medium">Завершение</span>
          </Button>
        </>
      )}
    </div>
  );
}
