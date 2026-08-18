/**
 * @fileoverview Бейдж Онлайн / Офлайн / Токен недействителен.
 * @module bot/canvas/bot-run-status-badge
 */

import { botCanvasStatusLabel, type BotCanvasStatus } from './bot-canvas-status';

/** Пропсы бейджа */
interface BotRunStatusBadgeProps {
  /** Статус для отображения (failed рисуется отдельно в футере) */
  status: Exclude<BotCanvasStatus, 'failed'>;
}

/**
 * Круглый бейдж статуса процесса / токена.
 * @param props - Статус
 * @returns JSX бейджа
 */
export function BotRunStatusBadge({ status }: BotRunStatusBadgeProps): React.JSX.Element {
  const invalid = status === 'invalid';
  const online = status === 'online';
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide',
        !invalid && 'uppercase',
        online && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        invalid && 'bg-red-500/10 text-red-500 border-red-500/30',
        !online && !invalid && 'border-border bg-muted text-muted-foreground',
      ].filter(Boolean).join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 shrink-0 rounded-full',
          online && 'bg-emerald-400',
          invalid && 'bg-red-500',
          !online && !invalid && 'bg-muted-foreground/50',
        ].filter(Boolean).join(' ')}
      />
      {botCanvasStatusLabel(status)}
    </span>
  );
}
