/**
 * @fileoverview Чип бота в выборе рассылки: активный или с недействительным токеном
 * @module client/components/editor/broadcast/wizard/bot-token-select-chip
 */

import { Check } from 'lucide-react';
import { cn } from '@/utils/utils';
import { isTokenActiveForBroadcast } from '@shared/broadcast-unauthorized';
import { formatBotShortLabel } from '../utils/format-bot-label';
import type { BotToken } from '@shared/schema';

/** Пропсы чипа выбора бота */
interface BotTokenSelectChipProps {
  /** Токен бота */
  token: BotToken;
  /** Бот выбран для рассылки */
  selected: boolean;
  /** Число получателей у этого бота */
  count?: number;
  /** Переключить выбор бота */
  onToggle: (tokenId: number) => void;
}

/**
 * Чип бота: кликабельный, если токен действителен
 * @param props - Свойства чипа
 * @returns JSX элемент чипа
 */
export function BotTokenSelectChip({ token, selected, count, onToggle }: BotTokenSelectChipProps) {
  const inactive = !isTokenActiveForBroadcast(token.isActive);

  return (
    <button
      type="button"
      disabled={inactive}
      title={inactive ? 'Токен недействителен. Обновите в настройках проекта.' : undefined}
      onClick={() => onToggle(token.id)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all',
        inactive && 'cursor-not-allowed opacity-60 border-destructive/40 text-muted-foreground',
        !inactive && 'hover:bg-accent/60 hover:shadow-sm',
        !inactive && selected
          ? 'border-blue-500/50 bg-gradient-to-r from-blue-500/15 to-violet-500/15 text-foreground shadow-sm'
          : !inactive && 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'flex h-3.5 w-3.5 items-center justify-center rounded border shrink-0',
          inactive && 'border-destructive/40',
          !inactive && selected && 'border-blue-500 bg-blue-500 text-white',
          !inactive && !selected && 'border-muted-foreground/40',
        )}
      >
        {!inactive && selected && <Check className="h-2.5 w-2.5" />}
      </span>
      <span className="truncate max-w-[160px]">{formatBotShortLabel(token, token.id)}</span>
      {inactive && <span className="text-[10px] text-destructive">токен недействителен</span>}
      {!inactive && selected && count != null && (
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {count.toLocaleString('ru-RU')}
        </span>
      )}
    </button>
  );
}
