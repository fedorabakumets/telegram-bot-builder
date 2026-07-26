/**
 * @fileoverview Контекст запуска над панелью логов (как service / deploy id у Railway)
 * @module terminal/TerminalLogsContextBar
 */

/** Пропсы полоски контекста */
interface TerminalLogsContextBarProps {
  /** Основной заголовок (имя бота / «Живые логи») */
  title: string;
  /** Вторичный id (launchId или tokenId) */
  subtitle?: string;
  /** Бейдж статуса */
  statusLabel?: string;
  /** Класс бейджа */
  statusClassName?: string;
}

/**
 * Компактная шапка над логом: title / id · статус
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalLogsContextBar({
  title,
  subtitle,
  statusLabel,
  statusClassName,
}: TerminalLogsContextBarProps) {
  return (
    <div className="flex h-9 items-center gap-2 px-4 border-b border-border/60 bg-muted/20 shrink-0 min-w-0">
      <span className="text-xs font-medium text-foreground truncate">{title}</span>
      {subtitle && (
        <>
          <span className="text-muted-foreground/50 text-xs">/</span>
          <span className="text-[11px] font-mono text-muted-foreground truncate">{subtitle}</span>
        </>
      )}
      {statusLabel && (
        <span
          className={[
            'ml-auto inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide shrink-0',
            statusClassName ?? 'bg-muted text-muted-foreground border-border',
          ].join(' ')}
        >
          {statusLabel}
        </span>
      )}
    </div>
  );
}
