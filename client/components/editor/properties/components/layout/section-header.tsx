/**
 * @fileoverview Универсальный компонент заголовка секции
 * Для accordion-секций в панели свойств.
 * @module section-header
 */

import { Button } from '@/components/ui/button';

/** Пропсы компонента SectionHeader */
interface SectionHeaderProps {
  /** Заголовок секции */
  title: string;
  /** Описание секции (опционально) */
  description?: string;
  /** Состояние: открыта ли секция */
  isOpen: boolean;
  /** Обработчик переключения состояния */
  onToggle: () => void;
  /** Название иконки FontAwesome (без префикса 'fa-') */
  icon: string;
  /** Цветовой класс градиента для иконки */
  iconGradient: string;
  /** Цвет иконки */
  iconColor: string;
  /** Цвет текста заголовка (gradient classes) */
  titleGradient?: string;
  /** Дополнительные классы для контейнера */
  className?: string;
}

/**
 * Универсальный заголовок accordion-секции.
 * Отображает иконку, заголовок, описание и кнопку сворачивания.
 * @param {SectionHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент заголовка секции
 */
export function SectionHeader({
  title,
  description,
  isOpen,
  onToggle,
  icon,
  iconGradient,
  iconColor,
  titleGradient,
  className = ''
}: SectionHeaderProps): JSX.Element {
  return (
    <Button
      onClick={onToggle}
      variant="ghost"
      className={`flex items-start gap-2.5 sm:gap-3 w-full hover:opacity-75 transition-opacity duration-200 p-0 h-auto ${className}`}
      title={isOpen ? 'Свернуть' : 'Развернуть'}
    >
      <div className={`w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br ${iconGradient} flex items-center justify-center flex-shrink-0 pt-0.5`}>
        <i className={`fas fa-${icon} ${iconColor} text-sm sm:text-base`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm sm:text-base font-bold ${titleGradient || 'text-slate-900 dark:text-slate-100'} text-left`}>
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-600/70 dark:text-slate-400/70 mt-0.5 text-left">
            {description}
          </p>
        )}
      </div>
      <i
        className={`fas fa-chevron-down text-xs sm:text-sm ${iconColor} ml-auto flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
      ></i>
    </Button>
  );
}
