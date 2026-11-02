/** @fileoverview Подсказки графиков используют поверхность текущей темы вместо белого фона Recharts. */
/** Общие цвета подсказки и спокойная подсветка наведённого интервала. */
export const ANALYTICS_TOOLTIP_THEME = {
  contentStyle: {
    backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)',
    border: '1px solid var(--border)', borderRadius: 8, padding: 12,
    fontSize: 12, lineHeight: '16px',
  },
  labelStyle: { color: 'var(--muted-foreground)' },
  cursor: { stroke: 'var(--border)', fill: 'var(--muted)', fillOpacity: 0.25 },
};
