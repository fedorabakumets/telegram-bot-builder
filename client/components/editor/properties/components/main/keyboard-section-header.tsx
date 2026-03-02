/**
 * @fileoverview Заголовок секции клавиатуры
 *
 * Компонент заголовка с кнопкой сворачивания.
 */

import { SectionHeader } from '../layout/section-header';
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
    <SectionHeader
      title="Клавиатура"
      description="Кнопки для взаимодействия с пользователем"
      isOpen={isOpen}
      onToggle={onToggle}
      icon="keyboard"
      iconGradient="from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50"
      iconColor="text-amber-600 dark:text-amber-400"
      descriptionColor="text-amber-700/70 dark:text-amber-300/70"
    />
  );
}
