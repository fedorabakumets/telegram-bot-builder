/**
 * @fileoverview Заголовок карточки кнопки
 * 
 * Отображает иконку, название и кнопку удаления.
 */

import { Button as UiButton } from '@/components/ui/button';
import type { Button as ButtonType } from '@shared/schema';
import { ButtonTypeBadge } from './button-type-badge';

/** Пропсы заголовка карточки кнопки */
interface ButtonCardHeaderProps {
  /** Объект кнопки */
  button: ButtonType;
  /** Флаг множественного выбора */
  allowMultipleSelection?: boolean;
  /** Функция удаления кнопки */
  onDelete: () => void;
  /** ID узла */
  nodeId: string;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<ButtonType>) => void;
}

/**
 * Компонент заголовка карточки кнопки
 * 
 * @param {ButtonCardHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок карточки
 */
export function ButtonCardHeader({
  button,
  allowMultipleSelection,
  onDelete,
  nodeId,
  onButtonUpdate
}: ButtonCardHeaderProps) {
  return (
    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-between">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-200/50 dark:bg-blue-900/40 group-hover:bg-blue-300/50 dark:group-hover:bg-blue-800/50 transition-all">
          <i className="fas fa-rectangle-ad text-xs sm:text-sm text-blue-600 dark:text-blue-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
            Кнопка
          </div>
          {allowMultipleSelection && (
            <ButtonTypeBadge 
              nodeId={nodeId}
              button={button}
              onButtonUpdate={onButtonUpdate}
            />
          )}
        </div>
      </div>
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
