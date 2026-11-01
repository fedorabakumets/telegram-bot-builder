/** @fileoverview Виртуализация строк с учётом реальной высоты, масштаба и активной ячейки. */
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { TableRow } from '../types';
import { TableViewportContext } from './table-viewport-context';
/**
 * Выбирает только строки в видимой области и измеряет высоту изменяемого текста.
 * @param rows - Строки после фильтров и сортировки.
 * @param activeId - Строка активного редактора для сохранения фокуса.
 * @param estimate - Начальная высота строки до измерения.
 * @param resetKey - Ключ фильтров для возврата к началу выборки.
 * @returns Видимые индексы, отступы и измерение строки.
 */
export function useTableWindow(rows: TableRow[], activeId: number | undefined, estimate: number, resetKey: string) {
  const viewport = useContext(TableViewportContext);
  const heights = useRef(new Map<number, number>());
  const elements = useRef(new Map<number, HTMLTableRowElement>());
  const observer = useRef<ResizeObserver | null>(null);
  const [version, setVersion] = useState(0);
  const [window, setWindow] = useState({ top: 0, height: 600, header: 80 });
  const scale = viewport?.scale ?? 1;
  useEffect(() => {
    const element = viewport?.element.current;
    if (!element) return;
    let frame = 0;
    /** Читает только геометрию локального контейнера с ограничением частоты кадров. */
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWindow({ top: element.scrollTop / scale, height: element.clientHeight / scale, header: (element.querySelector('thead')?.getBoundingClientRect().height ?? 80 * scale) / scale }));
    };
    const resize = new ResizeObserver(update); resize.observe(element);
    element.addEventListener('scroll', update, { passive: true }); update();
    observer.current = new ResizeObserver((entries) => {
      let changed = false;
      entries.forEach((entry) => {
        const id = Number((entry.target as HTMLElement).dataset.rowId);
        const height = (entry.target as HTMLElement).getBoundingClientRect().height / scale;
        if (height > 0 && Math.abs((heights.current.get(id) ?? estimate) - height) > 0.5) { heights.current.set(id, height); changed = true; }
      });
      if (changed) setVersion((value) => value + 1);
    });
    setVersion((value) => value + 1);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.current?.disconnect(); element.removeEventListener('scroll', update); };
  }, [viewport?.element, scale, estimate]);
  useEffect(() => { const element = viewport?.element.current; if (element) element.scrollTop = 0; }, [resetKey, viewport?.element]);
  const offsets = useMemo(() => {
    const result = [0]; rows.forEach((row) => result.push(result[result.length - 1] + (heights.current.get(row.id) ?? estimate))); return result;
  }, [rows, estimate, version]);
  const indices = useMemo(() => {
    const top = Math.max(0, window.top - window.header), bottom = top + window.height;
    let low = 0, high = rows.length;
    while (low < high) { const mid = (low + high) >>> 1; if (offsets[mid + 1] < top) low = mid + 1; else high = mid; }
    const start = Math.max(0, low - 8);
    let end = low; while (end < rows.length && offsets[end] < bottom) end++;
    const result = new Set(Array.from({ length: Math.max(0, Math.min(rows.length, end + 8) - start) }, (_, index) => start + index));
    const active = rows.findIndex((row) => row.id === activeId); if (active >= 0) result.add(active);
    return [...result].sort((a, b) => a - b);
  }, [rows, offsets, window, activeId]);
  /** Подписывает видимую строку на измерение высоты после её появления. */
  function measure(id: number, element: HTMLTableRowElement | null) {
    const previous = elements.current.get(id); if (previous) observer.current?.unobserve(previous);
    if (element) { elements.current.set(id, element); observer.current?.observe(element); } else elements.current.delete(id);
  }
  /** Прокручивает клавиатурный переход к строке, которая может ещё не быть отрисована. */
  function reveal(index: number) {
    const element = viewport?.element.current; if (!element) return;
    const top = offsets[index] * scale, bottom = offsets[index + 1] * scale;
    if (top < element.scrollTop) element.scrollTop = top;
    else if (bottom > element.scrollTop + element.clientHeight) element.scrollTop = bottom - element.clientHeight + window.header * scale;
  }
  return { indices, offsets, measure, reveal };
}
