/**
 * @fileoverview Стилизованный чекбокс для панели свойств
 * Более заметный и выделенный по сравнению с нативным input[type=checkbox]
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
 * Обёртка над Checkbox с фоновой подложкой и чётким визуальным выделением
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
        'flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150',
        'border border-transparent',
        'hover:bg-accent/50 dark:hover:bg-accent/30',
        checked
          ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30'
          : 'bg-muted/30 dark:bg-muted/20',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value as boolean)}
        disabled={disabled}
        className="shrink-0"
      />
      <div className="flex flex-col gap-0.5 select-none">
        <span className={cn(
          'text-xs font-medium leading-tight',
          checked ? 'text-foreground' : 'text-muted-foreground',
        )}>
          {label}
        </span>
        {description && (
          <span className="text-[10px] text-muted-foreground/70 leading-tight">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}
