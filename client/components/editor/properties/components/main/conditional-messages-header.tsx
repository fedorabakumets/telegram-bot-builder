/**
 * @fileoverview Заголовок секции условных сообщений
 * 
 * Компонент заголовка с кнопкой сворачивания и счётчиком условий.
 */

import type { Node } from '@shared/schema';

/** Пропсы компонента */
interface ConditionalMessagesHeaderProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
}

/**
 * Компонент заголовка секции условных сообщений
 * 
 * @param {ConditionalMessagesHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок секции
 */
export function ConditionalMessagesHeader({
  selectedNode,
  isOpen,
  onToggle
}: ConditionalMessagesHeaderProps) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3 w-full hover:opacity-75 transition-opacity duration-200 group" onClick={onToggle}>
      <button
        className="flex items-start gap-2.5 sm:gap-3 w-full"
        title={isOpen ? 'Свернуть' : 'Развернуть'}
      >
        <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 flex items-center justify-center flex-shrink-0 pt-0.5">
          <i className="fas fa-code-branch text-purple-600 dark:text-purple-400 text-sm sm:text-base"></i>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-purple-900 dark:text-purple-100 text-left">Условные сообщения</h3>
          <p className="text-xs sm:text-sm text-purple-700/70 dark:text-purple-300/70 mt-0.5 text-left">Разные ответы на основе условий</p>
        </div>
      </button>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
          {(selectedNode.data.conditionalMessages || []).length}
        </span>
        <i className={`fas fa-chevron-down text-xs sm:text-sm text-purple-600 dark:text-purple-400 transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}></i>
      </div>
    </div>
  );
}
