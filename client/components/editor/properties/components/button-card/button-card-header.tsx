/**
 * @fileoverview Заголовок карточки кнопки
 *
 * Отображает кнопки управления: дублировать и удалить.
 */

import { Button as UiButton } from '@/components/ui/button';
import type { Button as ButtonType } from '@shared/schema';

/** Пропсы заголовка карточки кнопки */
interface ButtonCardHeaderProps {
  /** Флаг множественного выбора */
  allowMultipleSelection?: boolean;
  /** Функция удаления кнопки */
  onDelete: () => void;
  /** Функция дублирования кнопки */
  onDuplicate?: () => void;
  /** ID узла */
  nodeId: string;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<ButtonType>) => void;
}

/**
 * Компонент заголовка карточки кнопки
 *
 * @param props - Пропсы компонента
 * @returns JSX элемент заголовка
 */
export function ButtonCardHeader({
  onDelete,
  onDuplicate,
}: ButtonCardHeaderProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {onDuplicate && (
        <UiButton
          size="sm"
          variant="ghost"
          onClick={onDuplicate}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 h-auto p-1.5 transition-colors duration-200 flex-shrink-0"
          title="Дублировать кнопку"
        >
          <i className="fas fa-copy w-4 h-4" />
        </UiButton>
      )}
      <UiButton
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="text-blue-600 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400 h-auto p-1.5 transition-colors duration-200 flex-shrink-0"
        title="Удалить кнопку"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </UiButton>
    </div>
  );
}
