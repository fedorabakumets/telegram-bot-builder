/**
 * @fileoverview Баннер: рассылка остановлена, потому что токен бота недействителен
 * @module client/components/editor/broadcast/components/broadcast-unauthorized-hint
 */

import { KeyRound } from 'lucide-react';
import { BOT_UNAUTHORIZED_HINT } from '@shared/broadcast-unauthorized';

/**
 * Короткое предупреждение про отозванный токен
 * @returns JSX элемент
 */
export function BroadcastUnauthorizedHint() {
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-snug text-rose-600 dark:text-rose-400">
      <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{BOT_UNAUTHORIZED_HINT}</span>
    </p>
  );
}
