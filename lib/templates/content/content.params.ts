/**
 * @fileoverview Параметры шаблона загрузки контента из таблицы _content
 * @module templates/content/content.params
 */

/** Параметры для генерации кода загрузки контента */
export interface ContentTemplateParams {
  /** ID проекта (для запроса к БД) */
  projectId: number;
  /** Интервал перезагрузки кэша в секундах */
  reloadIntervalSeconds: number;
}
