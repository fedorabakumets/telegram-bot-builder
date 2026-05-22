/**
 * @fileoverview Стилизованный чекбокс для панели свойств
 * Крупный квадрат с контрастной рамкой, отделённый от текста
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
 * Квадрат чекбокса визуально отделён от текста надписи
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
    <div className={cn('flex items-center gap-3 py-1.5', className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value as boolean)}
        disabled={disabled}
        className="shrink-0 !h-[18px] !w-[18px] !rounded"
        style={{
          border: checked ? '2px solid var(--primary)' : '2px solid hsl(215, 20%, 50%)',
          background: checked ? 'var(--primary)' : 'transparent',
        }}
      />
      <label
        htmlFor={id}
        className={cn(
          'cursor-pointer select-none flex flex-col gap-0.5',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span className={cn(
          'text-xs font-medium leading-tight',
          checked ? 'text-foreground' : 'text-muted-foreground',
        )}>
          {label}
        </span>
        {description && (
          <span className="text-[10px] text-muted-foreground/60 leading-tight">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}
