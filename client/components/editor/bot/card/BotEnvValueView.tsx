/**
 * @fileoverview Значение переменной окружения: секрет, ссылка на сервер, логический флаг
 * @module components/editor/bot/card/BotEnvValueView
 */

import { cn } from '@/utils/utils';

/** Свойства отображения значения */
interface BotEnvValueViewProps {
  /** Текст, который видит пользователь */
  displayValue: string;
  /** Секрет скрыт точками */
  masked: boolean;
  /** Значение пришло как ссылка ${{KEY}} */
  isServerRef: boolean;
}

/**
 * Рисует значение переменной: маску, бейдж ссылки, флаг или обычный текст
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvValueView({ displayValue, masked, isServerRef }: BotEnvValueViewProps) {
  if (masked) {
    return (
      <span
        className="inline-flex h-5 items-center gap-[3px] rounded-full bg-muted px-2"
        aria-label="Скрыто"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="h-1 w-1 rounded-full bg-muted-foreground/70" />
        ))}
      </span>
    );
  }
  if (isServerRef) {
    return (
      <span className="inline-flex max-w-full truncate rounded-full bg-violet-500/10 px-2 py-0.5 font-mono text-[11px] text-violet-700 dark:text-violet-300">
        {displayValue}
      </span>
    );
  }
  if (displayValue === 'true' || displayValue === 'false') {
    const on = displayValue === 'true';
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        on
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'bg-muted text-muted-foreground',
      )}>
        <span className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-emerald-500' : 'bg-muted-foreground/45')} />
        {displayValue}
      </span>
    );
  }
  if (!displayValue) {
    return <span className="text-[11px] italic text-muted-foreground/50">не задано</span>;
  }
  const url = /^https?:\/\//.test(displayValue);
  return (
    <span className={cn(
      'block truncate font-mono text-[12px] leading-5',
      url ? 'text-sky-700 dark:text-sky-300' : 'text-foreground/80',
    )}>
      {displayValue}
    </span>
  );
}
