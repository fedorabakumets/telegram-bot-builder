/**
 * @fileoverview Нода бота на холсте в стиле Railway service card
 * @module bot/canvas/BotServiceNode
 */

import { useRef } from 'react';
import { BotAvatar } from '../card/BotAvatar';
import type { BotToken } from '@shared/schema';
import type { NodePos } from './use-bot-node-layout';

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
  /** Выбор ноды (клик без drag) */
  onSelect: () => void;
  /** Позиция left/top */
  position: NodePos;
  /** Масштаб холста (для корректного drag) */
  scale: number;
  /** Обновление позиции при drag */
  onMove: (pos: NodePos, persist: boolean) => void;
}

/**
 * Карточка-нода бота: клик — выбор, drag — перемещение
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotServiceNode({
  token,
  projectId,
  isRunning,
  selected,
  onSelect,
  position,
  scale,
  onMove,
}: BotServiceNodeProps) {
  const title = token.botFirstName || token.name || `Бот ${token.id}`;
  const username = token.botUsername ? `@${token.botUsername}` : 'Telegram Bot';
  const left = position?.left ?? 0;
  const top = position?.top ?? 0;
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);

  return (
    <button
      type="button"
      data-bot-node="true"
      data-canvas-node="true"
      aria-pressed={selected}
      aria-label={title}
      style={{ left, top }}
      className={[
        'absolute w-[240px] overflow-hidden rounded-xl border p-0 text-left touch-none',
        'bg-card shadow-sm transition-[border-color,box-shadow,transform]',
        'hover:-translate-y-0.5 hover:shadow-md',
        selected
          ? 'z-10 border-blue-500/70 ring-1 ring-blue-500/30 shadow-[0_8px_24px_rgba(37,99,235,0.12)]'
          : 'border-border/70 hover:border-blue-500/35',
        'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        drag.current = { x: e.clientX, y: e.clientY, left, top, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = (e.clientX - d.x) / scale;
        const dy = (e.clientY - d.y) / scale;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
        if (!d.moved) return;
        onMove({ left: d.left + dx, top: d.top + dy }, false);
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* */
        }
        if (!d) return;
        if (d.moved) {
          const dx = (e.clientX - d.x) / scale;
          const dy = (e.clientY - d.y) / scale;
          onMove({ left: d.left + dx, top: d.top + dy }, true);
        } else {
          onSelect();
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <div className="flex items-center gap-3 px-3 pt-3 pb-2.5 pointer-events-none">
        <BotAvatar
          tokenId={token.id}
          projectId={projectId}
          photoUrl={token.botPhotoUrl}
          botName={title}
          size={40}
          variant="service"
          className="shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate leading-tight">{title}</div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">{username}</div>
        </div>
      </div>
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
    </button>
  );
}
