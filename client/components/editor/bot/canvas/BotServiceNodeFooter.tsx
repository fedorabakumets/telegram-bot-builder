/**
 * @fileoverview Футер статуса ноды бота (Railway-style online / failed)
 * @module bot/canvas/BotServiceNodeFooter
 */

import { AlertTriangle } from 'lucide-react';
import { formatRelativeRu } from '../card/launch-history-utils';
import type { BotServiceFailure } from './bot-service-failure';

/** Пропсы футера ноды */
interface BotServiceNodeFooterProps {
  /** Бот сейчас online */
  isRunning: boolean;
  /** Последний failed запуск */
  failure?: BotServiceFailure | null;
}

/**
 * Нижняя полоса: Online/Offline или «Запуск с ошибкой · N мин назад»
 * @param props - Свойства
 * @returns JSX
 */
export function BotServiceNodeFooter({
  isRunning,
  failure,
}: BotServiceNodeFooterProps) {
  const showFailure = !isRunning && !!failure;

  if (showFailure && failure) {
    const when = formatRelativeRu(failure.at);
    const title = failure.message
      ? `${failure.message} (${when})`
      : `Запуск с ошибкой · ${when}`;
    return (
      <div
        className="flex items-center gap-2 border-t border-red-500/25 bg-red-500/5 px-3 py-2 pointer-events-none"
        title={title}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
        <span className="min-w-0 truncate text-[11px] font-medium text-red-500">
          Запуск с ошибкой · {when}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/50 bg-muted/20 px-3 py-2 pointer-events-none">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 font-medium">
        Bot
      </span>
      <span
        className={[
          'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
          isRunning
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'border-border bg-muted text-muted-foreground',
        ].join(' ')}
      >
        <span
          className={[
            'w-1.5 h-1.5 rounded-full',
            isRunning ? 'bg-emerald-400' : 'bg-muted-foreground/50',
          ].join(' ')}
        />
        {isRunning ? 'Онлайн' : 'Офлайн'}
      </span>
    </div>
  );
}
