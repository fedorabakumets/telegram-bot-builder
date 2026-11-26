/**
 * @fileoverview Универсальный компонент заголовка секции
 * Для accordion-секций в панели свойств.
 * @module section-header
 */

/** Пропсы компонента SectionHeader */
interface SectionHeaderProps {
  /** Заголовок секции */
  title: string | React.ReactNode;
  /** Описание секции (опционально) */
  description?: React.ReactNode;
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
  /** Цвет текста описания (например, 'text-blue-700/70 dark:text-blue-300/70') */
  descriptionColor?: string;
  /** Дополнительные классы для контейнера */
  className?: string;
  /** Дополнительный контент справа (например, бейдж) */
  extraContent?: React.ReactNode;
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
  className = '',
  extraContent
}: SectionHeaderProps): JSX.Element {
  return (
    <button
      type="button"
      data-properties-section-heading
      aria-expanded={isOpen}
      onClick={onToggle}
      className={`grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded text-left hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 ${className}`}
    >
      <span data-properties-icon className={`flex size-7 items-center justify-center rounded-md bg-gradient-to-br ${iconGradient}`}>
        <i aria-hidden="true" className={`fas fa-${icon} ${iconColor} text-sm`} />
      </span>
      <span className="min-w-0 break-words text-sm font-semibold leading-tight text-foreground">{title}</span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {extraContent}
        <i aria-hidden="true" className={`fas fa-chevron-down transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </span>
      {description && <span className="col-span-full text-xs leading-snug text-muted-foreground">{description}</span>}
    </button>
  );
}