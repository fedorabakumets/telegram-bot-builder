/** @fileoverview Общая сетка карточек аудитории и сообщений с согласованными уровнями графиков. */
import { useRef, type ReactNode } from 'react';
import { useSourcesCardAlignment } from './use-sources-card-alignment';
import './analytics-overview-pair.css';

/** Измеряемые строки заголовка, значения и управления. */
const OVERVIEW_ROWS = [
  ['--overview-heading-height', '.metric-title-line'],
  ['--overview-number-height', '.metric-number'],
  ['--overview-controls-height', '.analytics-chart-toolbar'],
];

/**
 * Выравнивает графики при переносах текста и раскрытии настроек одной из карточек.
 * @param props - Карточки пользователей и сообщений.
 * @returns Адаптивная пара с общей высотой строк.
 */
export function AnalyticsOverviewPair({ children }: {
  /** Карточки основных показателей. */
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useSourcesCardAlignment(rootRef, OVERVIEW_ROWS);
  return <div ref={rootRef} className="analytics-overview-pair analytics-grid grid grid-cols-1 gap-4">{children}</div>;
}
