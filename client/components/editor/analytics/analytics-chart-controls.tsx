/** @fileoverview Подписанные переключатели графиков с доступным состоянием выбора. */
import { CHART_GRANULARITY_ORDER, CHART_GRANULARITY_TITLES, type ChartGranularity } from '@/components/editor/database/user-database/hooks/queries/chart-granularity';
import type { SourcesPeriod } from './sources-period';

/** Свойства выбора одного значения. */
interface SelectionProps<T extends string> {
  /** Текущее значение. */
  value: T;
  /** Сменить значение. */
  onChange: (value: T) => void;
}
/** Вариант переключателя. */
interface Choice<T extends string> {
  /** Значение для запроса или представления. */
  value: T;
  /** Видимая подпись. */
  label: string;
  /** Дополнительное пояснение. */
  title?: string;
}
/**
 * Показывает подписанную группу переключателей без скрытых за значками настроек.
 * @param props - Название группы, варианты и выбранное значение.
 * @returns Доступная группа кнопок.
 */
function Selection<T extends string>({ label, options, value, onChange }: SelectionProps<T> & {
  /** Название настройки. */
  label: string;
  /** Доступные варианты. */
  options: Choice<T>[];
}) {
  return <div className="analytics-control-field">
    <span>{label}</span>
    <div className="analytics-segments" role="group" aria-label={label}>
      {options.map(option => <button type="button" key={option.value} title={option.title}
        aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
    </div>
  </div>;
}
/** Подписи периодов без сокращений единиц до одной буквы. */
const PERIOD_LABELS = ['1 час', '3 часа', '24 часа', '7 дней', '30 дней', '12 недель', '12 месяцев'];
/** Варианты периодов со сведениями о шаге графика. */
const PERIODS = CHART_GRANULARITY_ORDER.map((value, index) => ({ value, label: PERIOD_LABELS[index], title: CHART_GRANULARITY_TITLES[value] }));
/**
 * Выбирает временное окно графика.
 * @param props - Период и обработчик выбора.
 * @returns Переключатель периода.
 */
export function AnalyticsPeriodControl({ label = 'Период', ...props }: SelectionProps<ChartGranularity> & {
  /** Уточняет, какие показатели зависят от выбранного периода. */
  label?: string;
}) {
  return <Selection {...props} label={label} options={PERIODS} />;
}
/**
 * Выбирает срок источников, включая всю аудиторию.
 * @param props - Срок и обработчик выбора.
 * @returns Переключатель срока источников.
 */
export function AnalyticsSourcesPeriodControl(props: SelectionProps<SourcesPeriod>) {
  return <Selection {...props} label="Период" options={[...PERIODS, { value: 'all', label: 'Всё время' }]} />;
}
/**
 * Выбирает обычный или накопительный подсчёт.
 * @param props - Режим и обработчик выбора.
 * @returns Переключатель подсчёта.
 */
export function AnalyticsModeControl(props: SelectionProps<'period' | 'cumulative'>) {
  return <Selection {...props} label="Подсчёт" options={[{ value: 'period', label: 'За период' }, { value: 'cumulative', label: 'Накопительно' }]} />;
}
/**
 * Выбирает вид графика.
 * @param props - Вид и обработчик выбора.
 * @returns Переключатель вида.
 */
export function AnalyticsTypeControl(props: SelectionProps<'bar' | 'line'>) {
  return <Selection {...props} label="Вид графика" options={[{ value: 'line', label: 'Линия' }, { value: 'bar', label: 'Столбцы' }]} />;
}
/**
 * Выбирает общий график или разбивку по источникам.
 * @param props - Режим источников и обработчик выбора.
 * @returns Переключатель разбивки.
 */
export function AnalyticsSourceControl(props: SelectionProps<'total' | 'by-source'>) {
  return <Selection {...props} label="Разбивка" options={[{ value: 'total', label: 'Все пользователи' }, { value: 'by-source', label: 'По источникам' }]} />;
}
/**
 * Разделяет входящие и исходящие сообщения.
 * @param props - Режим сообщений и обработчик выбора.
 * @returns Переключатель сообщений.
 */
export function AnalyticsMessagesControl(props: SelectionProps<'total' | 'split'>) {
  return <Selection {...props} label="Сообщения" options={[{ value: 'total', label: 'Все' }, { value: 'split', label: 'Входящие и исходящие' }]} />;
}
/**
 * Разделяет новых и вернувшихся пользователей.
 * @param props - Режим аудитории и обработчик выбора.
 * @returns Переключатель аудитории.
 */
export function AnalyticsUsersControl(props: SelectionProps<'total' | 'split'>) {
  return <Selection {...props} label="Аудитория" options={[{ value: 'total', label: 'Все активные' }, { value: 'split', label: 'Новички и вернувшиеся' }]} />;
}
