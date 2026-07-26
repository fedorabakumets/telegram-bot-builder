/**
 * @fileoverview Нода бота на холсте с drag-перемещением
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
  const username = token.botUsername ? `@${token.botUsername}` : null;
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
        'absolute w-[220px] text-left rounded-xl border bg-card/95 backdrop-blur-sm',
        'shadow-sm hover:shadow-md p-3 space-y-2 touch-none',
        selected ? 'border-primary ring-2 ring-primary/30 z-10' : 'border-border/60 hover:border-border',
        'cursor-grab active:cursor-grabbing',
      ].join(' ')}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        drag.current = {
          x: e.clientX,
          y: e.clientY,
          left,
          top,
          moved: false,
        };
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
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* */ }
        if (!d) return;
        if (d.moved) {
          const dx = (e.clientX - d.x) / scale;
          const dy = (e.clientY - d.y) / scale;
          onMove({ left: d.left + dx, top: d.top + dy }, true);
        } else {
          onSelect();
        }
      }}
      onPointerCancel={() => { drag.current = null; }}
    >
      <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
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
      <div className="flex items-center gap-1.5 text-xs pointer-events-none">
        <span
          className={[
            'w-2 h-2 rounded-full',
            isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40',
          ].join(' ')}
        />
        <span className="text-muted-foreground">{isRunning ? 'Онлайн' : 'Готов'}</span>
      </div>
    </button>
  );
}
