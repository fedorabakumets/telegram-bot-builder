/**
 * @fileoverview Стилизованный чекбокс для панели свойств
 * Крупный, контрастный, хорошо заметный на тёмном фоне
 * @module components/editor/properties/components/common/property-checkbox
 */

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/utils';

/** Пропсы компонента PropertyCheckbox */
interface PropertyCheckboxProps {
  /** Уникальный идентификатор */
  id: string;
  /** Текст лейбла */
  label: string;
  /** Текущее значение */
  checked: boolean;
  /** Обработчик изменения */
  onChange: (checked: boolean) => void;
  /** Дополнительное описание под лейблом */
  description?: string;
  /** Дополнительные классы обёртки */
  className?: string;
  /** Отключён ли чекбокс */
  disabled?: boolean;
}

/**
 * Стилизованный чекбокс для панели свойств
 * Крупный квадрат с контрастной рамкой + подложка-строка
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function PropertyCheckbox({
  id,
  label,
  checked,
  onChange,
  description,
  className,
  disabled = false,
}: PropertyCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150',
        'border',
        'hover:bg-accent/60 dark:hover:bg-accent/40',
        checked
          ? 'bg-primary/8 border-primary/30 dark:bg-primary/15 dark:border-primary/40'
          : 'bg-muted/40 border-border/60 dark:bg-muted/30 dark:border-border/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value as boolean)}
        disabled={disabled}
        className={cn(
          'shrink-0 h-5 w-5 rounded border-2 transition-all',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/60 dark:border-muted-foreground/50 bg-background dark:bg-muted/40',
        )}
      />
      <div className="flex flex-col gap-0.5 select-none">
        <span className={cn(
          'text-sm font-medium leading-tight',
          checked ? 'text-foreground' : 'text-foreground/80 dark:text-foreground/70',
        )}>
          {label}
        </span>
        {description && (
          <span className="text-[11px] text-muted-foreground/70 leading-tight">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}
