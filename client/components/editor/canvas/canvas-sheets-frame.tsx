/** @fileoverview Рамка панели листов с перетаскиваемой боковой границей. */
import { useRef, useState, type ReactNode } from 'react';
import type { CanvasSheetsPosition } from './use-canvas-sheets-position';

const widthKey = 'botcraft-canvas-sheets-width';
const defaultWidth = 160;

/** Возвращает сохранённую ширину панели в пикселях. */
function readWidth() {
  try {
    const value = Number(localStorage.getItem(widthKey));
    if (value >= 96 && value <= 480) return value;
  } catch { /* Используем исходную ширину. */ }
  return defaultWidth;
}

/**
 * Сохраняет выбранную ширину в браузере.
 * @param width - Ширина в пикселях.
 */
function saveWidth(width: number) {
  try { localStorage.setItem(widthKey, String(Math.max(96, width))); } catch { /* Ширина остаётся в текущем редакторе. */ }
}

/** Свойства оболочки листов. */
interface CanvasSheetsFrameProps {
  /** К какой стороне холста прикреплена панель. */
  position: CanvasSheetsPosition;
  /** Список или горизонтальная лента листов. */
  children: ReactNode;
}

/**
 * Размещает листы у выбранной стороны и выделяет ручку при фокусе.
 * @param props - Положение и содержимое панели.
 * @returns Рамка и ручка изменения размера.
 */
export function CanvasSheetsFrame({ position, children }: CanvasSheetsFrameProps) {
  const [width, setWidth] = useState(readWidth);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; x: number; width: number; next: number } | null>(null);
  const vertical = position === 'left' || position === 'right';
  const direction = position === 'left' ? 1 : -1;

  /**
   * Ограничивает ширину по доступному месту, оставляя холсту не менее половины.
   * @param requested - Желаемая ширина.
   * @returns Допустимая ширина в пикселях.
   */
  const limit = (requested: number) => {
    const max = Math.min(480, Math.floor((frame.current?.parentElement?.clientWidth ?? 960) / 2));
    return Math.max(Math.min(96, max), Math.min(max, Math.round(requested)));
  };

  return (
    <div ref={frame} data-canvas-sheets={position} style={vertical ? { width } : undefined}
      className={`relative z-30 shrink-0 border-border ${
        position === 'left' ? 'order-first max-w-[50%] border-r' :
        position === 'right' ? 'max-w-[50%] border-l' :
        position === 'top' ? 'order-first border-b' : 'bg-background'
      }`}>
      {children}
      {vertical && (
        <div role="separator" aria-orientation="vertical" aria-label="Изменить ширину панели листов"
          title="Потяните, чтобы изменить ширину панели листов" tabIndex={0}
          className={`group absolute inset-y-0 z-10 flex w-3 touch-none cursor-col-resize items-center justify-center outline-none focus-visible:outline-none ${
            position === 'left' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
          }`}
          onPointerDown={event => {
            if (event.button !== 0 || drag.current) return;
            const start = frame.current?.offsetWidth ?? width;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { pointer: event.pointerId, x: event.clientX, width: start, next: start };
          }}
          onPointerMove={event => {
            const current = drag.current;
            if (!current || current.pointer !== event.pointerId) return;
            current.next = limit(current.width + (event.clientX - current.x) * direction);
            setWidth(current.next);
          }}
          onLostPointerCapture={event => {
            const current = drag.current;
            if (!current || current.pointer !== event.pointerId) return;
            drag.current = null;
            if (current.next !== current.width) saveWidth(current.next);
          }}
          onKeyDown={event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            event.stopPropagation();
            const delta = event.key === 'ArrowLeft' ? -16 : 16;
            const next = limit((frame.current?.offsetWidth ?? width) + delta * direction);
            setWidth(next);
            saveWidth(next);
          }}>
          <span aria-hidden="true" className="h-10 w-1 rounded-full bg-muted-foreground/40 group-hover:bg-primary group-focus-visible:bg-primary group-focus-visible:ring-2 group-focus-visible:ring-primary/40" />
        </div>
      )}
    </div>
  );
}
