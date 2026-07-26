/**
 * @fileoverview Нода бота на холсте вкладки «Бот»
 * @module bot/canvas/BotServiceNode
 */

import { BotAvatar } from '../card/BotAvatar';
import type { BotToken } from '@shared/schema';

/** Пропсы ноды сервиса-бота */
interface BotServiceNodeProps {
  /** Токен бота */
  token: BotToken;
  /** ID проекта */
  projectId: number;
  /** Запущен ли бот */
  isRunning: boolean;
  /** Выбрана ли нода */
  selected: boolean;
  /** Клик по ноде */
  onSelect: () => void;
  /** Стиль позиции (left/top) */
  style?: React.CSSProperties;
}

/**
 * Карточка-нода бота в стиле Railway
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotServiceNode({
  token,
  projectId,
  isRunning,
  selected,
  onSelect,
  style,
}: BotServiceNodeProps) {
  const title = token.botFirstName || token.name || `Бот ${token.id}`;
  const username = token.botUsername ? `@${token.botUsername}` : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      style={style}
      className={[
        'absolute w-[220px] text-left rounded-xl border bg-card/95 backdrop-blur-sm',
        'shadow-sm hover:shadow-md transition-all p-3 space-y-2',
        selected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-border/60 hover:border-border',
      ].join(' ')}
      aria-pressed={selected}
      aria-label={title}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <BotAvatar
          tokenId={token.id}
          projectId={projectId}
          photoUrl={token.botPhotoUrl}
          botName={title}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{title}</div>
          {username && (
            <div className="text-xs text-muted-foreground truncate">{username}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <span
          className={[
            'w-2 h-2 rounded-full',
            isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40',
          ].join(' ')}
        />
        <span className="text-muted-foreground">
          {isRunning ? 'Онлайн' : 'Готов'}
        </span>
      </div>
    </button>
  );
}
