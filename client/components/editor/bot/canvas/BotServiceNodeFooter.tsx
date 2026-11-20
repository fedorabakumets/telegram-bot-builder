/**
 * @fileoverview Футер статуса ноды бота (Railway-style online / failed / invalid token)
 * @module bot/canvas/BotServiceNodeFooter
 */

import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatRelativeRu } from '../card/launch-history-utils';
import { resolveBotCanvasStatus, type BotCanvasStatus } from './bot-canvas-status';
import { BotRunStatusBadge } from './bot-run-status-badge';
import type { BotServiceFailure } from './bot-service-failure';

/** Пропсы футера ноды */
interface BotServiceNodeFooterProps {
  /** Бот сейчас online */
  isRunning: boolean;
  /** Последнее завершение с ошибкой, включая сбой после успешной работы */
  failure?: BotServiceFailure | null;
  /** Подтверждённая ошибка авторизации Telegram */
  authorizationError?: string | null;
  /** Флаг активности: 0 — токен отключён */
  isActive?: number | null;
  /** Общий статус операции и процесса */
  visualStatus?: BotCanvasStatus;
  /** Режим следующего запуска и его источник. */
  launchModeLabel?: ReactNode;
}

/**
 * Нижняя полоса: состояние процесса, отказ токена или завершение с ошибкой.
 * Ответ статуса не содержит фазу сбоя: длительность запуска не доказывает её.
 * @param props - Свойства
 * @returns JSX
 */
export function BotServiceNodeFooter({
  isRunning,
  failure,
  isActive,
  authorizationError,
  visualStatus,
  launchModeLabel,
}: BotServiceNodeFooterProps) {
  const status = visualStatus ?? resolveBotCanvasStatus({
    isActive,
    authorizationError,
    isRunning,
    hasFailure: !!failure,
  });

  if (status === 'failed' && failure) {
    const when = formatRelativeRu(failure.at);
    const title = failure.message
      ? `${failure.message} (${when})`
      : `Бот завершился с ошибкой · ${when}`;
    return (
      <div
        className="flex items-center gap-2 border-t border-red-500/25 bg-red-500/5 px-3 py-2 pointer-events-none"
        title={title}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
        <span className="min-w-0 truncate text-[11px] font-medium text-red-500">
          Бот завершился с ошибкой · {when}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/50 bg-muted/20 px-3 py-2 pointer-events-none">
      {launchModeLabel ?? <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 font-medium">
        Bot
      </span>}
      <BotRunStatusBadge status={status} />
    </div>
  );
}
