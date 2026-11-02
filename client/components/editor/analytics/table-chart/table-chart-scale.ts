/** @fileoverview Явные деления числовой оси по фактическому диапазону значений. */
/**
 * Строит не более шести понятных делений, не растягивая единицу до четырёх.
 * @param values - Рассчитанные значения групп.
 * @returns Границы оси и значения её делений.
 */
export function getTableChartScale(values: number[]): {
  /** Нижняя и верхняя границы шкалы. */
  domain: [number, number];
  /** Числа на делениях оси. */
  ticks: number[];
} {
  const finite = values.filter(Number.isFinite);
  const minimum = Math.min(0, ...finite);
  const maximum = Math.max(0, ...finite);
  const integer = finite.every(Number.isInteger);
  const rawStep = (maximum - minimum || 1) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const factor = [1, 2, 5, 10].find(value => value * magnitude >= rawStep) ?? 10;
  const step = integer ? Math.max(1, factor * magnitude) : factor * magnitude;
  const lower = Math.floor(minimum / step) * step;
  const upper = Math.max(lower + step, Math.ceil(maximum / step) * step);
  const ticks = Array.from({ length: Math.round((upper - lower) / step) + 1 },
    (_, index) => Number((lower + index * step).toPrecision(12)));
  return { domain: [lower, upper], ticks };
}
