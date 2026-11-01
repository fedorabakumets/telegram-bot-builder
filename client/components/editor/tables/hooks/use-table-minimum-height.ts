/** @fileoverview Минимальная область сетки для десяти строк с учётом масштаба и переносов. */
import { useEffect, useState, type RefObject } from 'react';

/**
 * Измеряет заголовок и десять строк, сохраняя место для недостающих записей.
 * @param viewportRef - Прокручиваемая область сетки.
 * @param scale - Текущий коэффициент масштаба.
 * @param rowHeight - Оценка высоты строки до появления данных.
 * @returns Минимальная высота сетки вместе с панелью масштаба в экранных пикселях.
 */
export function useTableMinimumHeight(viewportRef: RefObject<HTMLDivElement>, scale: number, rowHeight: number) {
  const [height, setHeight] = useState(() => (rowHeight * 10 + 80) * scale + 48);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let frame = 0;
    /** Наибольший измеренный минимум не сжимает сетку при смене окна виртуализации. */
    let measuredMinimum = 0;
    /** Измеряет видимые строки после обновления разметки без синхронного цикла наблюдателя. */
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!viewport.offsetWidth) return;
        const rows = [...viewport.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-id]')].slice(0, 10);
        const header = viewport.querySelector('thead')?.getBoundingClientRect().height ?? 80 * scale;
        const rowsHeight = rows.reduce((total, row) => total + row.getBoundingClientRect().height, 0);
        const missingHeight = (10 - rows.length) * rowHeight * scale;
        const scrollbar = viewport.offsetHeight - viewport.clientHeight;
        const toolbar = viewport.previousElementSibling?.getBoundingClientRect().height ?? 48;
        measuredMinimum = Math.max(measuredMinimum, Math.ceil(header + rowsHeight + missingHeight + scrollbar + toolbar));
        setHeight(measuredMinimum);
      });
    };
    const resize = new ResizeObserver(measure);
    /** Обновляет подписки при фильтрации, виртуализации или изменении содержимого. */
    const observeRows = () => {
      resize.disconnect();
      const header = viewport.querySelector('thead');
      if (header) resize.observe(header);
      if (viewport.previousElementSibling) resize.observe(viewport.previousElementSibling);
      viewport.querySelectorAll('tbody tr[data-row-id]').forEach((row) => resize.observe(row));
      measure();
    };
    const mutations = new MutationObserver(observeRows);
    mutations.observe(viewport, { childList: true, subtree: true });
    observeRows();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutations.disconnect(); };
  }, [viewportRef, scale, rowHeight]);
  return height;
}
