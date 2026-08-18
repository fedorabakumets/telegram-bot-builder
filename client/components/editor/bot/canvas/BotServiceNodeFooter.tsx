/**
 * @fileoverview Футер статуса ноды бота (Railway-style online / failed / invalid token)
 * @module bot/canvas/BotServiceNodeFooter
 */

import { AlertTriangle, KeyRound } from 'lucide-react';
import { formatRelativeRu } from '../card/launch-history-utils';
import { resolveBotCanvasStatus } from './bot-canvas-status';
import { BotRunStatusBadge } from './bot-run-status-badge';
import type { BotServiceFailure } from './bot-service-failure';

/** Пропсы футера ноды */
interface BotServiceNodeFooterProps {
  /** Бот сейчас online */
  isRunning: boolean;
  /** Последний failed запуск */
  failure?: BotServiceFailure | null;
  /** isActive токена: 0 — Telegram отклонил */
  isActive?: number | null;
}

/**
 * Нижняя полоса: Online/Offline, «токен недействителен» или ошибка запуска.
 * @param props - Свойства
 * @returns JSX
 */
export function BotServiceNodeFooter({
  isRunning,
  failure,
  isActive,
}: BotServiceNodeFooterProps) {
  const status = resolveBotCanvasStatus({
    isActive,
    isRunning,
    hasFailure: !!failure,
  });

  if (status === 'invalid') {
    return (
      <div
        className="flex items-center gap-2 border-t border-red-500/25 bg-red-500/5 px-3 py-2 pointer-events-none"
        title="Токен отозван или бот удалён. Вставьте новый из @BotFather во вкладке Переменные."
      >
        <KeyRound className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
        <span className="min-w-0 truncate text-[11px] font-medium text-red-500">
          Токен недействителен
        </span>
      </div>
    );
  }

  if (status === 'failed' && failure) {
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
      <BotRunStatusBadge status={status} />
    </div>
  );
}
