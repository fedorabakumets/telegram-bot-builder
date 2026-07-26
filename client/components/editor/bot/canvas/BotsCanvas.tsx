/**
 * @fileoverview Холст с нодами ботов (фон-сетка, pan/zoom)
 * @module bot/canvas/BotsCanvas
 */

import { useMemo, useState } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotServiceNode } from './BotServiceNode';
import type { BotToken } from '@shared/schema';

/** Ширина ноды */
const NODE_W = 220;
/** Высота ноды с зазором */
const NODE_H = 100;
/** Горизонтальный зазор */
const GAP_X = 48;
/** Вертикальный зазор */
const GAP_Y = 40;
/** Колонок в раскладке */
const COLS = 3;

/** Пропсы холста ботов */
interface BotsCanvasProps {
  /** ID проекта */
  projectId: number;
  /** Токены для отображения */
  tokens: BotToken[];
  /** tokenId → running */
  runningByTokenId: Record<number, boolean>;
  /** Выбранный tokenId */
  selectedTokenId: number | null;
  /** Выбор ноды */
  onSelectToken: (tokenId: number) => void;
}

/**
 * Холст с точечной сеткой и нодами ботов
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotsCanvas({
  projectId,
  tokens,
  runningByTokenId,
  selectedTokenId,
  onSelectToken,
}: BotsCanvasProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });

  const positions = useMemo(
    () =>
      tokens.map((_, i) => ({
        left: (i % COLS) * (NODE_W + GAP_X),
        top: Math.floor(i / COLS) * (NODE_H + GAP_Y),
      })),
    [tokens],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted/20">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.35) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          width: COLS * (NODE_W + GAP_X),
          height: Math.max(1, Math.ceil(tokens.length / COLS)) * (NODE_H + GAP_Y),
        }}
      >
        {tokens.map((token, i) => (
          <BotServiceNode
            key={token.id}
            token={token}
            projectId={projectId}
            isRunning={!!runningByTokenId[token.id]}
            selected={selectedTokenId === token.id}
            onSelect={() => onSelectToken(token.id)}
            style={{ left: positions[i].left, top: positions[i].top }}
          />
        ))}
      </div>
      <div className="absolute bottom-3 left-3 flex flex-col gap-1 z-10">
        <Button type="button" size="icon" variant="secondary" className="h-8 w-8" onClick={() => setScale((s) => Math.min(1.6, s + 0.1))} aria-label="Приблизить">
          <Plus className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="secondary" className="h-8 w-8" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} aria-label="Отдалить">
          <Minus className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="secondary" className="h-8 w-8" onClick={() => { setScale(1); setPan({ x: 40, y: 40 }); }} aria-label="Сбросить вид">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      {tokens.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Нет ботов в проекте
        </div>
      )}
    </div>
  );
}
