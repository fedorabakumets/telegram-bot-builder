/**
 * @fileoverview Вертикальный тулбар холста ботов в стиле Railway
 * @module bot/canvas/BotsCanvasToolbar
 */

import {
  LayoutGrid,
  Plus,
  Minus,
  Expand,
  Maximize2,
  Minimize2,
} from 'lucide-react';

/** Пропсы тулбара холста */
interface BotsCanvasToolbarProps {
  /** Можно ли увеличить */
  canZoomIn: boolean;
  /** Можно ли уменьшить */
  canZoomOut: boolean;
  /** Приблизить */
  onZoomIn: () => void;
  /** Отдалить */
  onZoomOut: () => void;
  /** Уместить / сбросить вид */
  onFit: () => void;
  /** Полный экран */
  onToggleFullscreen: () => void;
  /** Сейчас fullscreen */
  isFullscreen: boolean;
}

/** Общие классы квадратной кнопки */
const BTN =
  'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground ' +
  'hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30';

/** Обёртка группы кнопок */
const GROUP =
  'flex flex-col items-center gap-0.5 rounded-xl border border-border/60 ' +
  'bg-card/95 backdrop-blur-sm p-1 shadow-sm';

/**
 * Левый вертикальный тулбар как у Railway
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotsCanvasToolbar({
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onFit,
  onToggleFullscreen,
  isFullscreen,
}: BotsCanvasToolbarProps) {
  return (
    <div
      data-canvas-controls="true"
      className="absolute bottom-4 left-4 z-10 flex flex-col gap-2"
    >
      <div className={GROUP}>
        <button type="button" className={BTN} onClick={onFit} title="Сбросить вид" aria-label="Сбросить вид">
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>

      <div className={GROUP}>
        <button type="button" className={BTN} onClick={onZoomIn} disabled={!canZoomIn} title="Приблизить" aria-label="Приблизить">
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" className={BTN} onClick={onZoomOut} disabled={!canZoomOut} title="Отдалить" aria-label="Отдалить">
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" className={BTN} onClick={onFit} title="Уместить" aria-label="Уместить">
          <Expand className="h-4 w-4" />
        </button>
      </div>

      <div className={GROUP}>
        <button
          type="button"
          className={BTN}
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'}
          aria-label={isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
