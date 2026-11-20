/**
 * @fileoverview Краткая сводка о выбранном боте, запуске и загруженных ошибках.
 * @module terminal/TerminalLogsContextBar
 */

import { CircleAlert } from 'lucide-react';
import { statusAppearance } from '@shared/status-appearance';

/** Свойства сводки запуска. */
interface TerminalLogsContextBarProps {
  /** Основной заголовок (имя бота / «Живые логи») */
  title: string;
  /** Вторичный id (launchId или tokenId) */
  subtitle?: string;
  /** Бейдж статуса */
  statusLabel?: string;
  /** Класс бейджа */
  statusClassName?: string;
  /** Отображаемое имя выбранного бота. */
  botName?: string;
  /** Сохранённая дата запуска в строковом виде. */
  startedAt?: string | null;
  /** Количество ошибок среди загруженных строк. */
  errorCount?: number;
  /** Включён ли фильтр по ошибкам. */
  errorsSelected?: boolean;
  /** Включает фильтр по ошибкам. */
  onShowErrors?: () => void;
}

/** Форматирует дату запуска в часовом поясе браузера.
 * @param value - Сохранённая дата запуска
 * @returns Дата для сводки или пустое значение
 */
function formatLaunchTime(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Показывает контекст логов и даёт перейти к ошибкам выбранного запуска.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalLogsContextBar({
  title,
  subtitle,
  statusLabel,
  statusClassName,
  botName,
  startedAt,
  errorCount,
  errorsSelected = false,
  onShowErrors,
}: TerminalLogsContextBarProps) {
  const launchTime = formatLaunchTime(startedAt);
  /** Онлайн использует зелёный цвет активного бота из общей палитры. */
  const onlineAppearance = statusLabel === 'Онлайн' ? statusAppearance('Активен') : undefined;
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 bg-muted/20 px-4 py-1.5 font-sans">
      {botName && <span title={botName} className="min-w-0 truncate text-xs font-medium text-foreground">{botName}</span>}
      <span className={botName ? 'text-xs text-muted-foreground' : 'text-xs font-medium text-foreground'}>{title}</span>
      {launchTime && <time dateTime={startedAt ?? undefined} className="text-xs text-muted-foreground">{launchTime}</time>}
      {subtitle && <span className="text-[11px] font-mono text-muted-foreground">{subtitle}</span>}
      {statusLabel && (
        <span
          style={onlineAppearance && { ...onlineAppearance, borderColor: `${onlineAppearance.color}4d` }}
          className={[
            'inline-flex shrink-0 items-center rounded-full border px-2 text-[11px] font-medium',
            statusClassName ?? 'bg-muted text-muted-foreground border-border',
          ].join(' ')}
        >
          {statusLabel}
        </span>
      )}
      {errorCount !== undefined && onShowErrors && (
        <button
          type="button"
          title="Ошибки среди загруженных строк"
          aria-label={`Показать ошибки. Загружено: ${errorCount}`}
          aria-pressed={errorsSelected}
          onClick={onShowErrors}
          className="ml-auto inline-flex min-h-6 shrink-0 items-center gap-1.5 rounded border border-transparent px-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground aria-pressed:border-border aria-pressed:bg-muted"
        >
          <CircleAlert className="size-3.5" aria-hidden="true" />
          Ошибки
          <span className={errorCount > 0 ? 'tabular-nums text-red-500 dark:text-red-400' : 'tabular-nums'}>{errorCount}</span>
        </button>
      )}
    </div>
  );
}
