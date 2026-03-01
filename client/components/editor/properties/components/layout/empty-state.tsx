/**
 * @fileoverview Компонент пустого состояния панели свойств
 * 
 * Отображается когда ни один элемент не выбран для редактирования.
 * Содержит анимированную иконку и подсказки для пользователя.
 */

import { EmptyStateHeader } from './empty-state-header';
import { EmptyStateIcon } from './empty-state-icon';
import { EmptyStateText } from './empty-state-text';
import { EmptyStateTips } from './empty-state-tips';

interface EmptyStateProps {
  /** Функция закрытия панели */
  onClose?: () => void;
}

/**
 * Компонент пустого состояния панели свойств
 * 
 * @param {EmptyStateProps} props - Пропсы компонента
 * @returns {JSX.Element} Пустое состояние
 */
export function EmptyState({ onClose }: EmptyStateProps) {
  return (
    <aside className="w-full h-full bg-background border-l border-border flex flex-col">
      <EmptyStateHeader onClose={onClose} />
      <div className="flex flex-col items-center px-8 pt-12 empty-state-container">
        <div className="text-center max-w-xs">
          <EmptyStateIcon />
          <EmptyStateText />
          <EmptyStateTips />
        </div>
      </div>
    </aside>
  );
}
