/** @fileoverview Общий выпадающий список настроек запуска бота и проекта. */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Вариант настройки. */
interface RuntimeOption {
  /** Значение для сохранения. */
  value: string;
  /** Подпись в списке. */
  label: string;
}

/** Свойства списка настройки запуска. */
interface BotRuntimeSelectProps {
  /** Доступное имя поля. */
  label: string;
  /** Текущее значение. */
  value: string;
  /** Варианты выбора. */
  options: readonly RuntimeOption[];
  /** Обрабатывает выбор. */
  onChange: (value: string) => void;
  /** Запрещает изменение. */
  disabled?: boolean;
  /** Текст вместо отсутствующего значения. */
  placeholder?: string;
  /** Идентификатор пояснения. */
  descriptionId?: string;
}

/** Общие варианты режима сна. */
export const SLEEP_OPTIONS = [{ value: 'direct', label: 'Нет' }, { value: 'process', label: 'Да' }] as const;

/** Общие варианты лимита перезапуска. */
export const RESTART_ATTEMPT_OPTIONS = Array.from({ length: 10 }, (_, index) => ({
  value: String(index + 1), label: `Максимум попыток: ${index + 1}`,
}));

/**
 * Отображает одинаковый список в настройках проекта и отдельных ботов.
 * @param props - Свойства списка.
 * @returns Поле выбора.
 */
export function BotRuntimeSelect({ label, value, options, onChange, disabled, placeholder, descriptionId }: BotRuntimeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-auto min-h-8 w-full text-left text-xs [&>span]:whitespace-normal"
        aria-label={label} aria-describedby={descriptionId}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => <SelectItem key={option.value} value={option.value} className="text-xs">{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
