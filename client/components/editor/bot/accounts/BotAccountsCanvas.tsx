/** @fileoverview Холст аккаунтов с навигацией и масштабированием холста ботов. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasViewport } from '@/components/editor/canvas/canvas/use-canvas-viewport';
import { BotsCanvasToolbar } from '../canvas/BotsCanvasToolbar';
import { useCanvasFullscreen } from '../canvas/use-canvas-fullscreen';
import { defaultGridPos, type NodePos } from '../canvas/use-bot-node-layout';
import { BotAccountCanvasCard } from './BotAccountCanvasCard';
import type { MockAccountBot, MockTelegramAccount } from './mock-account-types';

/** Свойства рабочей области аккаунтов. */
interface BotAccountsCanvasProps {
  /** Аккаунты текущего проекта. */
  accounts: readonly MockTelegramAccount[];
  /** Боты, которые могут быть связаны с аккаунтами. */
  bots: readonly MockAccountBot[];
  /** Идентификатор выбранного аккаунта. */
  selectedAccountId: string | null;
  /** Открывает карточку аккаунта. */
  onSelectAccount: (id: string) => void;
  /** Открывает демонстрационную форму импорта. */
  onImport: () => void;
  /** Ширина панели, перекрывающей холст справа. */
  overlayPanelWidth?: number;
}

/** Габариты карточки с подписью связей и свободного поля вокруг неё. */
const CARD = { width: 240, height: 120, padding: 24 };

/**
 * Показывает аккаунты на интерактивном холсте и поддерживает перемещение карточек.
 * @param props - Аккаунты, боты и действия рабочей области.
 * @returns Холст аккаунтов с панелью масштаба.
 */
export function BotAccountsCanvas({
  accounts, bots, selectedAccountId, onSelectAccount, onImport, overlayPanelWidth = 0,
}: BotAccountsCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, NodePos>>({});
  const { isFullscreen, cssFullscreen, toggleFullscreen } = useCanvasFullscreen(rootRef);
  /** Позволяет перетаскивать фон только за пределами интерактивных элементов. */
  const isEmptyTarget = useCallback((target: HTMLElement) => !target.closest('[data-canvas-node], [data-canvas-controls]'), []);
  const {
    pan, zoom, setPan, setZoom, zoomRef, isPanning, animateTransform, triggerTransformAnimation,
    zoomIn, zoomOut, handleMouseDown, handleMouseUp, handleContextMenu,
  } = useCanvasViewport({ canvasRef, isEmptyTarget });
  const botsById = new Map(bots.map(bot => [bot.id, bot]));
  const cards = accounts.map((account, index) => ({
    account,
    position: positions[account.id] ?? defaultGridPos(index),
    linkedBots: account.botIds.flatMap(id => {
      const bot = botsById.get(id);
      return bot ? [bot] : [];
    }),
  }));
  const selectedPosition = useRef<NodePos | undefined>(undefined);
  selectedPosition.current = cards.find(({ account }) => account.id === selectedAccountId)?.position;

  /** При открытии панели размещает карточку в оставшейся части холста. */
  useEffect(() => {
    const position = selectedPosition.current;
    const viewport = canvasRef.current;
    if (!position || !viewport || viewport.clientWidth - overlayPanelWidth < CARD.width) return;
    const scale = zoomRef.current / 100;
    triggerTransformAnimation();
    setPan({
      x: (viewport.clientWidth - overlayPanelWidth - CARD.width * scale) / 2 - position.left * scale,
      y: (viewport.clientHeight - CARD.height * scale) / 2 - position.top * scale,
    });
  }, [selectedAccountId, overlayPanelWidth, setPan, triggerTransformAnimation, zoomRef]);

  /** Умещает карточки в видимой части холста. */
  const fitToContent = () => {
    const viewport = canvasRef.current;
    if (!viewport || cards.length === 0) return;
    const left = Math.min(...cards.map(card => card.position.left));
    const top = Math.min(...cards.map(card => card.position.top));
    const width = Math.max(...cards.map(card => card.position.left)) + CARD.width - left;
    const height = Math.max(...cards.map(card => card.position.top)) + CARD.height - top;
    const scale = Math.max(0.01, Math.min(
      1, (viewport.clientWidth - overlayPanelWidth - 2 * CARD.padding) / width,
      (viewport.clientHeight - 2 * CARD.padding) / height,
    ));
    triggerTransformAnimation();
    setZoom(scale * 100);
    setPan({ x: CARD.padding - left * scale, y: CARD.padding - top * scale });
  };

  const scale = zoom / 100;
  return (
    <div ref={rootRef} className={[
      'relative h-full min-h-0 w-full bg-gradient-to-br from-white via-blue-50/35 to-blue-100/30',
      'dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/35',
      cssFullscreen ? 'fixed inset-0 z-[200]' : '',
    ].join(' ')}>
      <div ref={canvasRef} className="bots-canvas-grid absolute inset-0 overflow-hidden"
        style={{
          cursor: isPanning ? 'grabbing' : 'grab', touchAction: 'none',
          backgroundImage: `radial-gradient(circle, rgb(59 130 246 / 0.34) ${Math.max(1, scale)}px, transparent ${Math.max(1, scale)}px)`,
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onContextMenu={handleContextMenu}>
        <div className="absolute inset-0 origin-top-left" style={{
          transform: `translate3d(${Math.round(pan.x)}px, ${Math.round(pan.y)}px, 0) scale(${scale})`,
          transition: animateTransform ? 'transform 200ms ease-out' : 'none',
        }}>
          {cards.map(({ account, position, linkedBots }) => (
            <BotAccountCanvasCard key={account.id} account={account} linkedBots={linkedBots}
              selected={selectedAccountId === account.id} position={position} scale={scale}
              onMove={next => setPositions(current => ({ ...current, [account.id]: next }))}
              onSelect={() => {
                if (isFullscreen) void toggleFullscreen().then(() => onSelectAccount(account.id));
                else onSelectAccount(account.id);
              }} />
          ))}
        </div>
        {accounts.length === 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-5">
            <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm"
              data-canvas-controls="true">
              <UsersRound aria-hidden="true" className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-semibold">Нет аккаунтов в проекте</p>
              <Button type="button" variant="outline" size="sm" onClick={onImport}>
                <Upload aria-hidden="true" className="h-4 w-4" /> Импортировать сессию
              </Button>
            </div>
          </div>
        )}
      </div>
      <BotsCanvasToolbar zoom={zoom} canZoomIn={zoom < 200} canZoomOut={zoom > 1}
        onZoomIn={zoomIn} onZoomOut={zoomOut} onFit={fitToContent}
        onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />
    </div>
  );
}
