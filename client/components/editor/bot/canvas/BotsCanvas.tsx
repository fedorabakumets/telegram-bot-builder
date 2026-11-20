/**
 * @fileoverview Холст ботов на viewport редактора (pan/zoom/pinch)
 * @module bot/canvas/BotsCanvas
 */

import { useCallback, useMemo, useRef } from 'react';
import { BotServiceNode } from './BotServiceNode';
import { BotProjectNode } from './BotProjectNode';
import { BotsCanvasToolbar } from './BotsCanvasToolbar';
import { useCanvasFullscreen } from './use-canvas-fullscreen';
import { useBotNodeLayout } from './use-bot-node-layout';
import { useFocusSelectedBot } from './use-focus-selected-bot';
import { useCanvasViewport } from '@/components/editor/canvas/canvas/use-canvas-viewport';
import type { BotServiceFailure } from './bot-service-failure';
import type { BotToken } from '@shared/schema';

/** Высота строки, зарезервированной под карточку проекта. */
const PROJECT_ROW_HEIGHT = 128;

/** Пропсы холста ботов */
interface BotsCanvasProps {
  /** ID проекта */
  projectId: number;
  /** Название текущего проекта. */
  projectName: string;
  /** Режим запуска проекта по умолчанию. */
  projectLaunchMode: 'polling' | 'webhook';
  /** Выбрана ли карточка проекта. */
  projectSelected: boolean;
  /** Открывает панель проекта. */
  onSelectProject: () => void;
  /** Токены */
  tokens: BotToken[];
  /** tokenId → running */
  runningByTokenId: Record<number, boolean>;
  /** tokenId → последний failed запуск */
  failureByTokenId?: Record<number, BotServiceFailure>;
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
  projectName,
  projectLaunchMode,
  projectSelected,
  onSelectProject,
  tokens,
  runningByTokenId,
  failureByTokenId = {},
  selectedTokenId,
  onSelectToken,
  overlayPanelWidth = 0,
}: BotsCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, cssFullscreen, toggleFullscreen } = useCanvasFullscreen(rootRef);
  const tokenIds = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const { positions, setNodePos, contentSize } = useBotNodeLayout(projectId, tokenIds);
  /** Сдвигаем отображаемые координаты, оставляя сохранённую раскладку совместимой. */
  const botPositions = useMemo(() => Object.fromEntries(
    Object.entries(positions).map(([id, pos]) => [id, { ...pos, top: pos.top + PROJECT_ROW_HEIGHT }]),
  ), [positions]);

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
    positions: botPositions,
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
        'relative h-full min-h-0 w-full',
        'bg-gradient-to-br from-white via-blue-50/35 to-blue-100/30',
        'dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/35',
        cssFullscreen ? 'fixed inset-0 z-[200]' : '',
      ].join(' ')}
    >
      <div
        ref={canvasRef}
        className="bots-canvas-grid absolute inset-0 overflow-hidden"
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
          touchAction: 'none',
          backgroundImage: `radial-gradient(circle, rgb(59 130 246 / 0.34) ${Math.max(1, scale)}px, transparent ${Math.max(1, scale)}px)`,
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        <div
          className="origin-top-left"
          style={{
            width: contentSize.width,
            height: contentSize.height + PROJECT_ROW_HEIGHT,
            transform: `translate3d(${Math.round(pan.x)}px, ${Math.round(pan.y)}px, 0) scale(${scale})`,
            transition: animateTransform ? 'transform 200ms ease-out' : 'none',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="relative h-full w-full">
            <BotProjectNode
              name={projectName}
              launchMode={projectLaunchMode}
              botCount={tokens.length}
              selected={projectSelected}
              onSelect={() => {
                if (isFullscreen) void toggleFullscreen().then(onSelectProject);
                else onSelectProject();
              }}
            />
            {tokens.map((token) => {
              const pos = botPositions[token.id];
              if (!pos) return null;
              return (
                <BotServiceNode
                  key={token.id}
                  token={token}
                  projectId={projectId}
                  projectLaunchMode={projectLaunchMode}
                  isRunning={!!runningByTokenId[token.id]}
                  failure={failureByTokenId[token.id] ?? null}
                  selected={selectedTokenId === token.id}
                  onSelect={() => onSelectToken(token.id)}
                  position={pos}
                  scale={scale}
                  onMove={(next, persist) => setNodePos(
                    token.id, { ...next, top: next.top - PROJECT_ROW_HEIGHT }, persist,
                  )}
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
