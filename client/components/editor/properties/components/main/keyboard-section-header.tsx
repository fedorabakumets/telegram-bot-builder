/**
 * @fileoverview Заголовок секции клавиатуры
 * 
 * Компонент заголовка с кнопкой сворачивания и индикатором типа клавиатуры.
 */

import { Badge } from '@/components/ui/badge';
import type { Node } from '@shared/schema';

/** Пропсы компонента */
interface KeyboardSectionHeaderProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
}

/**
 * Компонент заголовка секции клавиатуры
 * 
 * @param {KeyboardSectionHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок секции
 */
export function KeyboardSectionHeader({
  selectedNode,
  isOpen,
  onToggle
}: KeyboardSectionHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-start justify-between gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
    >
      <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
        <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 flex items-center justify-center flex-shrink-0 pt-0.5">
          <i className="fas fa-keyboard text-amber-600 dark:text-amber-400 text-sm sm:text-base"></i>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-100 text-left whitespace-normal">Клавиатура</h3>
          <p className="text-xs sm:text-sm text-amber-700/70 dark:text-amber-300/70 mt-0.5 text-left whitespace-normal">Кнопки для взаимодействия с пользователем</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {selectedNode.data.keyboardType !== 'none' && (
          <Badge variant="secondary" className="text-xs font-medium">
            {selectedNode.data.keyboardType === 'inline' ? '📍 Inline' : '💬 Reply'}
          </Badge>
        )}
        <i className={`fas fa-chevron-down text-amber-600 dark:text-amber-400 text-sm transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}></i>
      </div>
    </button>
  );
}
