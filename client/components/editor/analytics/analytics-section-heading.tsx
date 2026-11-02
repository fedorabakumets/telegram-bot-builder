/** @fileoverview Заголовки разделов аналитики с коротким пояснением. */
/**
 * Отделяет смысловые разделы статистики единым текстовым ритмом.
 * @param props - Название раздела и назначение его графиков.
 * @returns Заголовок раздела.
 */
export function AnalyticsSectionHeading({ title, description }: {
  /** Название группы графиков. */
  title: string;
  /** Краткое пояснение раздела. */
  description: string;
}) {
  return <div className="analytics-section-heading"><h3>{title}</h3><p>{description}</p></div>;
}
