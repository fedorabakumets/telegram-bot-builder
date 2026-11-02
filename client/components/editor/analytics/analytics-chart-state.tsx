/** @fileoverview Единые состояния загрузки, ошибки и отсутствия данных графика. */
/**
 * Сохраняет область графика при загрузке и объясняет отсутствие данных.
 * @param props - Текст состояния, признак загрузки и повторная загрузка.
 * @returns Скелетон или текстовый блок состояния.
 */
export function AnalyticsChartState({ loading, title = 'Пока нет данных', description, onRetry }: {
  /** Данные загружаются. */
  loading?: boolean;
  /** Краткое название состояния. */
  title?: string;
  /** Что нужно для появления графика. */
  description?: string;
  /** Повторить запрос после ошибки. */
  onRetry?: () => void;
}) {
  return <div className="analytics-chart-state" role={onRetry ? 'alert' : 'status'} aria-busy={loading}>
    {loading ? <><span className="sr-only">Загрузка графика</span><div aria-hidden="true" className="analytics-chart-skeleton">
      {[40, 64, 48, 80, 56, 96, 72, 88].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
    </div></> : <><p>{title}</p>{description && <span>{description}</span>}
      {onRetry && <button type="button" onClick={onRetry}>Повторить загрузку</button>}</>}
  </div>;
}
