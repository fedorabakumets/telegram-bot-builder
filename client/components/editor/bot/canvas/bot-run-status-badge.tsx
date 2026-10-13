/**
 * @fileoverview Бейдж Онлайн / Офлайн / Токен недействителен.
 * @module bot/canvas/bot-run-status-badge
 */

import { botCanvasStatusLabel, type BotCanvasStatus } from './bot-canvas-status';

/** Пропсы бейджа */
interface BotRunStatusBadgeProps {
  /** Статус процесса или текущей операции */
  status: BotCanvasStatus;
}

/**
 * Круглый бейдж статуса процесса / токена.
 * @param props - Статус
 * @returns JSX бейджа
 */
export function BotRunStatusBadge({ status }: BotRunStatusBadgeProps): React.JSX.Element {
  const invalid = status === 'invalid';
  const online = status === 'online';
  const failed = status === 'failed' || status === 'error';
  const starting = status === 'starting' || status === 'restarting';
  const stopping = status === 'stopping';
  const neutral = !online && !invalid && !failed && !starting && !stopping;
  return (
    <span
      role="status"
      aria-live="polite"
      className={[
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide',
        !invalid && 'uppercase',
        online && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        (invalid || failed) && 'bg-red-500/10 text-red-500 border-red-500/30',
        starting && 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        stopping && 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        neutral && 'border-border bg-muted text-muted-foreground',
      ].filter(Boolean).join(' ')}
    >
      <span
        data-status={status}
        aria-hidden="true"
        className={[
          'bot-status-dot h-1.5 w-1.5 shrink-0 rounded-full',
          online && 'bg-emerald-400',
          (invalid || failed) && 'bg-red-500',
          starting && 'bg-sky-400',
          stopping && 'bg-amber-400',
          neutral && 'bg-muted-foreground/50',
        ].filter(Boolean).join(' ')}
      />
      {botCanvasStatusLabel(status)}
    </span>
  );
}
