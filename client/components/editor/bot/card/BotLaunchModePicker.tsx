/** @fileoverview Общий выбор способа получения обновлений для проекта и бота. */
import { useId } from 'react';
import { Folder, Globe, Link2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/utils/utils';
import type { LaunchModeChoice } from './bot-launch-helpers';

/** Параметры выбора режима запуска. */
interface BotLaunchModePickerProps {
  /** Выбранное значение. */
  value: LaunchModeChoice;
  /** Обработчик выбора. */
  onChange: (value: LaunchModeChoice) => void;
  /** Подпись режима проекта; её наличие добавляет вариант наследования. */
  projectModeLabel?: string;
  /** Запрещает изменение во время сохранения. */
  disabled?: boolean;
}

/** Стандартные способы получения обновлений. */
const MODES = [
  { value: 'polling', title: 'Polling', description: 'Long-polling', icon: Globe },
  { value: 'webhook', title: 'Webhook', description: 'Входящий webhook', icon: Link2 },
] as const;

/**
 * Выводит одинаковые карточки Polling и Webhook в обеих формах.
 * @param props - Параметры выбора режима.
 * @returns Группа вариантов режима.
 */
export function BotLaunchModePicker({ value, onChange, projectModeLabel, disabled }: BotLaunchModePickerProps) {
  const groupId = useId();
  const options = projectModeLabel
    ? [{ value: 'inherit' as const, title: 'Как в проекте', description: projectModeLabel, icon: Folder }, ...MODES]
    : MODES;

  return (
    <RadioGroup value={value} onValueChange={(next) => onChange(next as LaunchModeChoice)}
      disabled={disabled} aria-label="Режим запуска" className="grid gap-2 @lg:grid-cols-3">
      {options.map(({ value: option, title, description, icon: Icon }) => {
        const id = `${groupId}-${option}`;
        return (
          <label key={option} htmlFor={id} className={cn(
            'flex items-start gap-2.5 rounded-md border px-3 py-2.5 transition-colors',
            disabled ? 'opacity-60' : 'cursor-pointer hover:bg-muted/20',
            value === option ? 'border-border bg-muted/40' : 'border-border/50',
          )}>
            <RadioGroupItem value={option} id={id} className="mt-0.5"
              aria-label={title} aria-describedby={`${id}-description`} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Icon aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{title}</span>
              </div>
              <p id={`${id}-description`} className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
          </label>
        );
      })}
    </RadioGroup>
  );
}
