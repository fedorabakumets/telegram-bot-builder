/** @fileoverview Подписанный переключатель накопительного подсчёта внутри периода. */
import './analytics-cumulative-toggle.css';
/** Показывает состояние накопления без сокращений подписи. @param props - Состояние и обработчик. @returns Доступный переключатель. */
export function AnalyticsCumulativeToggle({ checked, onChange }: {
  /** Включён ли накопительный подсчёт. */ checked: boolean;
  /** Меняет режим подсчёта. */ onChange: (checked: boolean) => void;
}) {
  return <button type="button" role="switch" aria-label="Накопительно внутри периода" aria-checked={checked}
    title="Складывать значения с начала выбранного периода" className="analytics-cumulative-toggle" onClick={() => onChange(!checked)}>
    <span className="analytics-cumulative-track" aria-hidden="true"><span /></span><span>Накопительно</span>
  </button>;
}
