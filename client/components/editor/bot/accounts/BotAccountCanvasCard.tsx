/** @fileoverview Карточка демонстрационного Telegram-аккаунта на холсте. */

import { useRef, type PointerEvent } from 'react';
import { Bot, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { NodePos } from '../canvas/use-bot-node-layout';
import type { MockAccountBot, MockTelegramAccount } from './mock-account-types';

/** Свойства карточки аккаунта. */
interface BotAccountCanvasCardProps {
  /** Сведения об аккаунте. */
  account: MockTelegramAccount;
  /** Боты, привязанные к аккаунту. */
  linkedBots: readonly MockAccountBot[];
  /** Аккаунт выбран в рабочей области. */
  selected: boolean;
  /** Положение карточки на холсте. */
  position: NodePos;
  /** Масштаб холста в долях единицы. */
  scale: number;
  /** Открывает настройки аккаунта. */
  onSelect: () => void;
  /** Меняет положение карточки. */
  onMove: (position: NodePos) => void;
}

/**
 * Показывает фотографию, статус аккаунта и его связи с ботами.
 * @param props - Свойства карточки.
 * @returns Подвижная карточка аккаунта.
 */
export function BotAccountCanvasCard({
  account, linkedBots, selected, position, scale, onSelect, onMove,
}: BotAccountCanvasCardProps) {
  const drag = useRef<{
    /** Указатель, перемещающий карточку. */
    id: number;
    /** Начальная координата указателя по горизонтали. */
    x: number;
    /** Начальная координата указателя по вертикали. */
    y: number;
    /** Исходное положение карточки. */
    origin: NodePos;
    /** Указатель вышел за порог обычного нажатия. */
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const connected = account.status === 'connected';
  const botNames = linkedBots.map(({ name }) => name).join(', ');
  const status = connected ? 'Подключён' : 'Отключён';

  /**
   * Перемещает карточку с учётом масштаба, если указатель вышел за порог нажатия.
   * @param event - Событие движения указателя.
   */
  const moveCard = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (active?.id !== event.pointerId) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) active.moved = true;
    if (active.moved) onMove({
      left: Math.max(0, active.origin.left + dx / scale),
      top: Math.max(0, active.origin.top + dy / scale),
    });
  };

  return (
    <button
      type="button"
      data-canvas-node="true"
      data-account-node={account.id}
      style={position}
      aria-pressed={selected}
      aria-label={account.name}
      className={[
        'absolute w-[240px] touch-none overflow-hidden rounded-xl border bg-card text-left shadow-sm',
        'cursor-grab transition-[border-color,box-shadow] active:cursor-grabbing',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'z-10 border-primary/70 ring-1 ring-primary/30' : 'border-border/70 hover:border-primary/50',
      ].join(' ')}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        suppressClick.current = false;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: position, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={moveCard}
      onPointerUp={(event) => {
        if (drag.current?.id !== event.pointerId) return;
        moveCard(event);
        suppressClick.current = drag.current.moved;
        drag.current = null;
      }}
      onLostPointerCapture={() => { drag.current = null; }}
      onClick={(event) => {
        if (event.detail === 0 || !suppressClick.current) onSelect();
        suppressClick.current = false;
      }}
    >
      <span className="flex items-center gap-3 px-3 py-3">
        <Avatar className="size-9 shrink-0 rounded-lg">
          <AvatarImage src={account.avatarUrl} alt="" className="object-cover" />
          <AvatarFallback className="rounded-lg text-muted-foreground">
            <UserRound className="size-5" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold" title={account.name}>{account.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{account.maskedPhone || 'Telegram'}</span>
        </span>
      </span>
      <span className="flex items-center justify-between gap-2 border-t border-border/70 px-3 py-2 text-xs">
        <span className="inline-flex shrink-0 items-center gap-1.5" title={botNames || 'Нет привязанных ботов'}>
          <Bot className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">Боты: {linkedBots.length}</span>
        </span>
        <span className={connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
          {status}
        </span>
      </span>
      {botNames && (
        <span className="block truncate px-3 pb-2 text-xs text-muted-foreground" title={botNames}>{botNames}</span>
      )}
    </button>
  );
}
