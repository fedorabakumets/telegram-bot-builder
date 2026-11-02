/** @fileoverview Синхронизация высоты заголовков, настроек и легенд двух карточек источников. */
import { useLayoutEffect, type RefObject } from 'react';

/** Стандартные строки двух карточек источников. */
const SOURCE_GROUPS: string[][] = [
      ['--sources-heading-height', '.analytics-card-heading > div:first-child, .analytics-source-distribution > div:first-child > div:first-child'],
      ['--sources-controls-height', '.analytics-chart-toolbar, .analytics-source-distribution > div:first-child > .analytics-control-field'],
      ['--sources-legend-height', '.analytics-source-legend, .analytics-donut-legend'],
    ];

/**
 * Измеряет естественную высоту содержимого и задаёт общие строки обеим карточкам.
 * @param rootRef - Контейнер пары графиков.
 * @param groups - Переменные размеров и селекторы согласованных строк.
 * @returns Ничего; размеры сохраняются в локальных переменных стилей.
 */
export function useSourcesCardAlignment(rootRef: RefObject<HTMLDivElement>, groups: string[][] = SOURCE_GROUPS) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    /** Применяет измерения после обновления разметки, не создавая синхронный цикл наблюдателя. */
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        groups.forEach(([property, selector]) => {
          const height = Math.max(0, ...Array.from(root.querySelectorAll(selector), element => element.getBoundingClientRect().height));
          root.style.setProperty(property, `${Math.ceil(height)}px`);
        });
      });
    };
    const resize = new ResizeObserver(measure);
    /** Подключает наблюдение при загрузке данных или раскрытии настроек. */
    const observe = () => {
      resize.disconnect();
      groups.forEach(([, selector]) => root.querySelectorAll(selector).forEach(element => resize.observe(element)));
      measure();
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    observe();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutations.disconnect(); };
  }, [rootRef, groups]);
}
