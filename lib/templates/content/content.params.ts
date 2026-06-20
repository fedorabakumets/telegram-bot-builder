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
  /** Генерировать машинерию live-reload (load_content/reload_content/циклы). По умолчанию true */
  contentCache?: boolean;
}
