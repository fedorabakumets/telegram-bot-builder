/** @fileoverview Читаемый список показателей аудитории с нейтральными подписями и акцентом на числах. */

/** Один показатель аудитории. */
export interface AudienceSummaryItem {
  /** Цвет небольшой статусной отметки. */
  className: string;
  /** Понятное название показателя. */
  label: string;
  /** Количество пользователей. */
  value: number;
}

/**
 * Отделяет подписи от значений и сохраняет читаемость на узкой панели.
 * @param props - Название группы и показатели аудитории.
 * @returns Семантический список числовых показателей.
 */
export function AnalyticsAudienceSummary({ title, items }: {
  /** Доступное название группы показателей. */
  title: string;
  /** Показатели в порядке отображения. */
  items: AudienceSummaryItem[];
}) {
  return <dl aria-label={title} className="analytics-audience-summary">
    {items.map(item => <div key={item.label}>
      <dt><span aria-hidden="true" className={item.className}>●</span>{item.label}</dt>
      <dd>{item.value.toLocaleString('ru-RU')}</dd>
    </div>)}
  </dl>;
}
