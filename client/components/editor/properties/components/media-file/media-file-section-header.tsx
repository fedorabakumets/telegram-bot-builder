/**
 * @fileoverview Заголовок секции медиафайлов
 * 
 * Компонент заголовка с кнопкой сворачивания.
 */

import { SectionHeader } from '../layout/section-header';

/** Пропсы заголовка секции медиа */
interface MediaFileSectionHeaderProps {
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
}

/**
 * Компонент заголовка секции медиафайлов
 * 
 * @param {MediaFileSectionHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок секции медиа
 */
export function MediaFileSectionHeader({ isOpen, onToggle }: MediaFileSectionHeaderProps) {
  return (
    <SectionHeader
      title="Прикрепленный медиафайл"
      description="Картинка, видео, аудио или документ"
      isOpen={isOpen}
      onToggle={onToggle}
      icon="paperclip"
      iconGradient="from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50"
      iconColor="text-rose-600 dark:text-rose-400"
      titleGradient="bg-gradient-to-r from-rose-900 to-pink-800 dark:from-rose-100 dark:to-pink-200 bg-clip-text text-transparent"
      descriptionColor="text-rose-700/70 dark:text-rose-300/70"
    />
  );
}
