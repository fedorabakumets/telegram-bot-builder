/** @fileoverview Содержимое выбора периода в шапке с календарём и раскрываемыми настройками отчёта. */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { REPORT_PERIODS, reportDay, reportStepAvailable, type AnalyticsReportFilter } from './analytics-report-filter';

/** Свойства общих фильтров. */
interface Props {
  /** Активные фильтры. */ filter: AnalyticsReportFilter;
  /** Применить фильтры. */ onChange: (filter: AnalyticsReportFilter) => void;
}
/**
 * Показывает периоды и календарь, раскрывая дополнительные настройки по запросу.
 * @param props - Фильтры и обработчик применения.
 * @returns Содержимое всплывающего выбора периода в шапке.
 */
export function AnalyticsReportControls({ filter, onChange }: Props) {
  const [dates, setDates] = useState({ from: filter.from, to: filter.to });
  const [error, setError] = useState('');
  useEffect(() => { setDates({ from: filter.from, to: filter.to }); }, [filter.from, filter.to]);
  /** Проверяет календарь перед применением. @returns Ничего; сохраняет даты либо ошибку. */
  function applyDates() {
    if (!dates.from || !dates.to || dates.to < dates.from || dates.from > reportDay(new Date(), filter.timezone)) {
      setError('Укажите начальную и конечную даты. Начало должно быть не позже окончания и сегодняшнего дня.'); return;
    }
    setError(''); onChange({ ...filter, ...dates, interval:undefined, period: 'custom', step: 'auto' });
  }
  const zones = [...new Set([filter.timezone, 'Europe/Moscow', 'UTC', 'Europe/Berlin', 'Asia/Almaty', 'Asia/Tashkent', 'Asia/Dubai', 'America/New_York'])];
  return <section className="space-y-4" aria-label="Период всех отчётов">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2 min-w-0 w-full"><span className="text-sm text-muted-foreground">Период отчёта</span>
        <div className="analytics-period-options" role="group" aria-label="Период">
          {Object.entries(REPORT_PERIODS).map(([value, label]) => <button key={value} type="button" aria-pressed={filter.period === value}
            onClick={() => onChange({ ...filter, interval:undefined, period: value as AnalyticsReportFilter['period'], step: 'auto' })}>{label}</button>)}
        </div>
      </div>
    </div>
    {filter.period === 'custom' && <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-3"><label className="analytics-control-field text-sm"><span>С даты</span><Input type="date" value={dates.from} aria-invalid={!!error} aria-describedby={error ? 'analytics-date-error' : undefined} onChange={e => setDates({ ...dates, from: e.target.value })} /></label>
        <label className="analytics-control-field text-sm"><span>По дату включительно</span><Input type="date" value={dates.to} aria-invalid={!!error} aria-describedby={error ? 'analytics-date-error' : undefined} onChange={e => setDates({ ...dates, to: e.target.value })} /></label>
        <Button variant="outline" onClick={applyDates}>Применить даты</Button></div>
      {error && <p id="analytics-date-error" role="alert" className="text-sm text-destructive">{error}</p>}
    </div>}
    <details className="analytics-period-settings space-y-3"><summary className="cursor-pointer text-sm font-medium">Настройки отчёта</summary>
      <div className="flex flex-wrap gap-4">
      <label className="analytics-control-field text-sm"><span>Часовой пояс</span><select className="analytics-native-field" value={filter.timezone}
        onChange={event => onChange({ ...filter, timezone: event.target.value })}>{zones.map(zone => <option key={zone}>{zone}</option>)}</select></label>
      <label className="analytics-control-field text-sm"><span>Детализация графиков</span><select className="analytics-native-field" value={filter.step ?? 'auto'} onChange={event => onChange({ ...filter, step: event.target.value as AnalyticsReportFilter['step'] })}><option value="auto">Автоматически</option>{[['1m', 'Минута'], ['5m', '5 минут'], ['1h', 'Час'], ['1d', 'День'], ['7d', '7 дней'], ['30d', '30 дней']].map(([value, label]) => <option key={value} value={value} disabled={!reportStepAvailable(filter, value)}>{label}</option>)}</select></label>
      </div>
    <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={filter.compare && filter.period !== 'all'} disabled={filter.period === 'all'} onChange={e => onChange({ ...filter, compare: e.target.checked })} />Сравнить с предыдущим периодом той же длительности</label>
    </details>
  </section>;
}
