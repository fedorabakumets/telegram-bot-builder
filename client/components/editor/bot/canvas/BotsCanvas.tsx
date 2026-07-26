/**
 * @fileoverview Холст ботов на viewport редактора (pan/zoom/pinch)
 * @module bot/canvas/BotsCanvas
 */

import { useCallback, useMemo, useRef } from 'react';
import { BotServiceNode } from './BotServiceNode';
import { BotsCanvasToolbar } from './BotsCanvasToolbar';
import { useCanvasFullscreen } from './use-canvas-fullscreen';
import { useBotNodeLayout } from './use-bot-node-layout';
import { useFocusSelectedBot } from './use-focus-selected-bot';
import { useCanvasViewport } from '@/components/editor/canvas/canvas/use-canvas-viewport';
import type { BotToken } from '@shared/schema';

/** Пропсы холста ботов */
interface BotsCanvasProps {
  /** ID проекта */
  projectId: number;
  /** Токены */
  tokens: BotToken[];
  /** tokenId → running */
  runningByTokenId: Record<number, boolean>;
  /** Выбранный tokenId */
  selectedTokenId: number | null;
  /** Выбор ноды */
  onSelectToken: (tokenId: number) => void;
  /** Ширина правого overlay (0 = закрыт); для фокуса камеры */
  overlayPanelWidth?: number;
}

/**
 * Холст ботов: жесты как у редактора + карточки токенов
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotsCanvas({
  projectId,
  tokens,
  runningByTokenId,
  selectedTokenId,
  onSelectToken,
  overlayPanelWidth = 0,
}: BotsCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, cssFullscreen, toggleFullscreen } = useCanvasFullscreen(rootRef);
  const tokenIds = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const { positions, setNodePos, contentSize } = useBotNodeLayout(projectId, tokenIds);

  const isEmptyTarget = useCallback((target: HTMLElement) => (
    !target.closest('[data-canvas-node]') && !target.closest('[data-canvas-controls]')
  ), []);

  const {
    pan,
    zoom,
    setPan,
    panRef,
    zoomRef,
    isPanning,
    animateTransform,
    triggerTransformAnimation,
    zoomIn,
    zoomOut,
    resetZoom,
    handleMouseDown,
    handleMouseUp,
    handleContextMenu,
  } = useCanvasViewport({
    canvasRef,
    isEmptyTarget,
  });

  useFocusSelectedBot({
    selectedTokenId,
    positions,
    canvasRef,
    zoomRef,
    panRef,
    setPan,
    triggerTransformAnimation,
    overlayPanelWidth,
  });

  const scale = zoom / 100;

  const fitToContent = useCallback(() => {
    resetZoom();
  }, [resetZoom]);

  return (
    <div
      ref={rootRef}
      className={[
        'relative h-full min-h-0 w-full bg-muted/20',
        cssFullscreen ? 'fixed inset-0 z-[200] bg-background' : '',
      ].join(' ')}
    >
      <div
        ref={canvasRef}
        className="bots-canvas-grid absolute inset-0 overflow-hidden"
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        <div
          className="origin-top-left"
          style={{
            width: contentSize.width,
            height: contentSize.height,
            transform: `translate3d(${Math.round(pan.x)}px, ${Math.round(pan.y)}px, 0) scale(${scale})`,
            transition: animateTransform ? 'transform 200ms ease-out' : 'none',
            backfaceVisibility: 'hidden',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.35) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative" style={{ width: contentSize.width, height: contentSize.height }}>
            {tokens.map((token) => {
              const pos = positions[token.id];
              if (!pos) return null;
              return (
                <BotServiceNode
                  key={token.id}
                  token={token}
                  projectId={projectId}
                  isRunning={!!runningByTokenId[token.id]}
                  selected={selectedTokenId === token.id}
                  onSelect={() => onSelectToken(token.id)}
                  position={pos}
                  scale={scale}
                  onMove={(next, persist) => setNodePos(token.id, next, persist)}
                />
              );
            })}
          </div>
        </div>
        {tokens.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground pointer-events-none">
            Нет ботов в проекте
          </div>
        )}
      </div>
      <BotsCanvasToolbar
        zoom={zoom}
        canZoomIn={zoom < 200}
        canZoomOut={zoom > 1}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fitToContent}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}
