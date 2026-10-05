/**
 * @fileoverview Левые кнопки холста редактора: масштаб и полный экран
 */

import { Expand, Maximize2, Minimize2, Minus, Plus } from 'lucide-react';

/** Свойства левой панели холста */
interface EditorCanvasSideControlsProps {
  /** Текущий масштаб в процентах */
  zoom: number;
  /** Можно увеличить */
  canZoomIn: boolean;
  /** Можно уменьшить */
  canZoomOut: boolean;
  /** Приблизить */
  onZoomIn: () => void;
  /** Отдалить */
  onZoomOut: () => void;
  /** Уместить узлы в экран */
  onFit: () => void;
  /** Уместить недоступно, если узлов нет */
  canFit: boolean;
  /** Холст на весь экран */
  isFullscreen: boolean;
  /** Включить или выключить полный экран */
  onToggleFullscreen: () => void;
}

/** Квадратная кнопка как на холсте ботов */
const BTN =
  'flex h-9 w-9 items-center justify-center rounded-lg text-blue-700/65 dark:text-blue-200/65 ' +
  'hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-200 transition-colors disabled:opacity-30';

/** Карточка группы кнопок */
const GROUP =
  'flex flex-col items-center gap-0.5 rounded-xl border border-blue-500/20 ' +
  'bg-white/90 p-1 shadow-[0_6px_20px_rgba(37,99,235,0.1)] backdrop-blur ' +
  'dark:border-blue-400/15 dark:bg-slate-950/90';

/**
 * Вертикальный блок масштаба и полного экрана у левого края холста.
 * @param props - Свойства панели
 * @returns Левые кнопки холста
 */
export function EditorCanvasSideControls({
  zoom,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onFit,
  canFit,
  isFullscreen,
  onToggleFullscreen,
}: EditorCanvasSideControlsProps) {
  const fullscreenLabel = isFullscreen ? 'Выйти из полного экрана' : 'Полный экран';
  return (
    <div
      data-canvas-controls="true"
      className="absolute bottom-20 left-4 z-40 flex flex-col gap-2 pointer-events-auto"
    >
      <div className={GROUP}>
        <button type="button" className={BTN} onClick={onZoomIn} disabled={!canZoomIn} title="Приблизить" aria-label="Приблизить">
          <Plus className="h-4 w-4" />
        </button>
        <div
          className="flex h-7 w-9 items-center justify-center text-[10px] font-medium tabular-nums text-muted-foreground"
          title="Масштаб"
        >
          {Math.round(zoom)}
        </div>
        <button type="button" className={BTN} onClick={onZoomOut} disabled={!canZoomOut} title="Отдалить" aria-label="Отдалить">
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" className={BTN} onClick={onFit} disabled={!canFit} title="Уместить" aria-label="Уместить">
          <Expand className="h-4 w-4" />
        </button>
      </div>
      <div className={GROUP}>
        <button
          type="button"
          className={BTN}
          onClick={onToggleFullscreen}
          title={fullscreenLabel}
          aria-label={fullscreenLabel}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
