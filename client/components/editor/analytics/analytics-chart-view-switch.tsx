/** @fileoverview Прямое переключение вида графика без выпадающего списка. */
import './analytics-chart-view-switch.css';
/** Свойства выбора вида. */
interface Props {
  /** Текущий вид графика. */ value: string;
  /** Применяет выбранный вид. */ onChange: (value: string) => void;
}
/** Показывает оба варианта и отмечает выбранный нижней линией. @param props - Вид и обработчик выбора. @returns Группа кнопок графика. */
export function AnalyticsChartViewSwitch({ value, onChange }: Props) {
  return <div className="analytics-chart-view-switch" role="group" aria-label="Вид графика">
    <button type="button" aria-pressed={value === 'line'} onClick={() => onChange('line')}>Линия</button>
    <button type="button" aria-pressed={value === 'bar'} onClick={() => onChange('bar')}>Столбцы</button>
  </div>;
}
