/**
 * @fileoverview Заголовок секции текста сообщения
 * 
 * Компонент заголовка с кнопкой сворачивания.
 */

import { SectionHeader } from '../layout/section-header';

/** Пропсы заголовка секции текста */
interface MessageTextSectionHeaderProps {
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
}

/**
 * Компонент заголовка секции текста сообщения
 * 
 * @param {MessageTextSectionHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок секции
 */
export function MessageTextSectionHeader({ isOpen, onToggle }: MessageTextSectionHeaderProps) {
  return (
    <SectionHeader
      title="Текст сообщения"
      description={
        <>
          <span className="text-xs sm:text-sm">Основное содержание</span>
          <br />
          <span className="text-xs sm:text-sm">для отправки пользователю</span>
        </>
      }
      isOpen={isOpen}
      onToggle={onToggle}
      icon="message"
      iconGradient="from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50"
      iconColor="text-blue-600 dark:text-blue-400"
      titleGradient="bg-gradient-to-r from-blue-900 to-cyan-800 dark:from-blue-100 dark:to-cyan-200 bg-clip-text text-transparent"
    />
  );
}
