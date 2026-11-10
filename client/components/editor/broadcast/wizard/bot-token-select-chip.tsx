/**
 * @fileoverview Чип бота в выборе рассылки: активный или с недействительным токеном
 * @module client/components/editor/broadcast/wizard/bot-token-select-chip
 */

import { Check } from 'lucide-react';
import { UserAvatar } from '@/components/editor/database/dialog/components/user-avatar';
import { cn } from '@/utils/utils';
import { isTokenActiveForBroadcast } from '@shared/broadcast-unauthorized';
import { formatBotShortLabel } from '../utils/format-bot-label';
import type { BotToken } from '@shared/schema';

/** Пропсы чипа выбора бота */
interface BotTokenSelectChipProps {
  /** Проект, к которому относится бот. */
  projectId: number;
  /** Telegram подтвердил заморозку бота. */
  frozen?: boolean;
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
export function BotTokenSelectChip({ projectId, token, frozen, selected, count, onToggle }: BotTokenSelectChipProps) {
  /** Ошибка токена не равна ручному отключению бота. */
  const unauthorized = token.authorizationError === 'unauthorized';
  const inactive = !!frozen || unauthorized || !isTokenActiveForBroadcast(token.isActive);

  return (
    <button
      type="button"
      disabled={inactive}
      aria-pressed={selected}
      title={frozen ? 'Бот заморожен Telegram' : unauthorized ? 'Недействительный токен. Замените токен из @BotFather в настройках бота.' : inactive ? 'Бот отключён' : undefined}
      onClick={() => onToggle(token.id)}
      className={cn(
        'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        inactive && 'cursor-not-allowed opacity-60 border-destructive/40 text-muted-foreground',
        !inactive && 'hover:bg-accent/60',
        !inactive && selected
          ? 'border-blue-500/40 bg-blue-500/10 text-foreground'
          : !inactive && 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'flex h-3.5 w-3.5 items-center justify-center rounded border shrink-0',
          inactive && 'border-destructive/40',
          !inactive && selected && 'border-primary bg-primary text-primary-foreground',
          !inactive && !selected && 'border-muted-foreground/40',
        )}
      >
        {!inactive && selected && <Check className="h-2.5 w-2.5" />}
      </span>
      <UserAvatar messageType="bot" projectId={projectId} tokenId={token.id} size={24} />
      <span className="truncate max-w-[160px]">{formatBotShortLabel(token, token.id)}</span>
      {inactive && <span className="text-[10px] text-destructive">{frozen ? 'заморожен' : unauthorized ? 'недействительный токен' : 'отключён'}</span>}
      {!inactive && selected && count != null && (
        <span className="font-semibold text-foreground tabular-nums">
          {count.toLocaleString('ru-RU')}
        </span>
      )}
    </button>
  );
}
