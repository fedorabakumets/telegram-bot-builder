/**
 * @fileoverview Панель обучения и подсветка зоны редактора
 * @module components/editor/canvas/learn/EditorLearnOverlay
 */

import { useEffect, useState } from 'react';
import { ScenariyLearnPanel } from '@/components/editor/scenariy/learn';
import type { EditorLearnFocus } from './editor-learn-steps';
import type { UseEditorLearnResult } from './use-editor-learn';
import { useEditorLearnSpotlight } from './use-editor-learn-spotlight';

/** Селектор подсвечиваемой зоны */
const FOCUS_SELECTOR: Record<EditorLearnFocus, string | null> = {
  none: null,
  palette: '[data-node-palette]',
  canvas: '[data-canvas-drop-zone]',
  links: null,
  properties: '[data-properties-panel]',
};

/** Подсветка линий между блоками, без рамки на всё поле */
const LINKS_HIGHLIGHT_CSS = `
  [data-canvas-connections] path:not([stroke="transparent"]) {
    stroke: var(--primary) !important;
    stroke-width: 5px !important;
    stroke-opacity: 1 !important;
    filter: drop-shadow(0 0 6px var(--primary));
  }
  [data-canvas-connections] polygon {
    fill: var(--primary) !important;
    opacity: 1 !important;
  }
`;

/** Прямоугольник подсветки в координатах окна */
interface FocusRect {
  /** Верх */
  top: number;
  /** Лево */
  left: number;
  /** Ширина */
  width: number;
  /** Высота */
  height: number;
}

/** Пропсы оверлея */
export interface EditorLearnOverlayProps {
  /** Состояние обучения */
  learn: UseEditorLearnResult;
  /** Палитра уже открыта */
  sidebarVisible?: boolean;
  /** Панель свойств уже открыта */
  propertiesVisible?: boolean;
  /** Показать палитру */
  onToggleSidebar?: () => void;
  /** Показать свойства */
  onToggleProperties?: () => void;
}

/**
 * Карточка шага поверх холста и рамка вокруг зоны шага
 * @param props - Свойства
 * @returns JSX элемент
 */
export function EditorLearnOverlay({
  learn,
  sidebarVisible,
  propertiesVisible,
  onToggleSidebar,
  onToggleProperties,
}: EditorLearnOverlayProps) {
  const [rect, setRect] = useState<FocusRect | null>(null);
  const { step } = learn;
  useEditorLearnSpotlight(step.spotlight);

  useEffect(() => {
    if (step.focus === 'palette' && sidebarVisible === false) onToggleSidebar?.();
    if (step.focus === 'properties' && propertiesVisible === false) onToggleProperties?.();
  }, [step.focus, sidebarVisible, propertiesVisible, onToggleSidebar, onToggleProperties]);

  useEffect(() => {
    const selector = step.spotlight ?? FOCUS_SELECTOR[step.focus];
    if (!selector) {
      setRect(null);
      return;
    }
    const read = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect(null);
        return;
      }
      const box = el.getBoundingClientRect();
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    };
    read();
    const id = window.setInterval(read, 400);
    window.addEventListener('resize', read);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('resize', read);
    };
  }, [step.id, step.focus, step.spotlight]);

  return (
    <>
      {step.focus === 'links' ? <style>{LINKS_HIGHLIGHT_CSS}</style> : null}
      {rect ? (
        <div
          className="fixed z-[60] pointer-events-none rounded-lg ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          aria-hidden="true"
        />
      ) : null}
      <div className="absolute top-16 left-3 z-[70] w-[min(42rem,calc(100%-1.5rem))] pointer-events-auto">
        <ScenariyLearnPanel
          step={step}
          stepNumber={learn.stepNumber}
          totalSteps={learn.totalSteps}
          lineReady={learn.lineReady && learn.taskDone}
          isLast={learn.isLast}
          isFirst={learn.isFirst}
          onLineDone={learn.markLineReady}
          onNext={learn.goNext}
          onBack={learn.goBack}
          onSkip={learn.isLast ? learn.finish : learn.skip}
        />
        {learn.lineReady && !learn.taskDone && learn.waitHint ? (
          <p className="mt-2 text-xs text-primary">{learn.waitHint}</p>
        ) : null}
      </div>
    </>
  );
}
