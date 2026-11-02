/** @fileoverview Сворачиваемый раздел аналитики с доступным заголовком. */
import type { ReactNode } from 'react';
/** Показывает раздел раскрытым с возможностью свернуть его. @param props - Заголовок, описание и содержимое. @returns Раздел аналитики. */
export function AnalyticsCollapsibleSection({ title, description, children }: {
  /** Название раздела. */ title: string;
  /** Краткое описание раздела. */ description: string;
  /** Графики и карточки раздела. */ children: ReactNode;
}) {
  return <details className="analytics-collapsible-section" open><summary className="analytics-collapsible-heading"><h3 className="analytics-collapsible-title">{title}</h3><span aria-hidden="true" className="analytics-collapsible-chevron">⌄</span></summary><p className="analytics-collapsible-description">{description}</p><div className="analytics-collapsible-content">{children}</div></details>;
}
