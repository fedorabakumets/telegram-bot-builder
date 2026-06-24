/**
 * @fileoverview Общие типы для инструментов конструктора ботов
 * @module lib/bot-tools/types
 */

/** Уровень серьёзности проблемы валидации */
export type ValidationSeverity = 'error' | 'warning';

/** Одна запись результата валидации */
export interface ValidationIssue {
  /** Уровень: ошибка или предупреждение */
  severity: ValidationSeverity;
  /** Путь до поля в JSON, например sheets[0].nodes[2].data.branches[1].target */
  path: string;
  /** Человекочитаемое описание проблемы */
  message: string;
  /** Код проблемы для программной обработки */
  code: string;
}

/** Результат валидации project.json */
export interface ValidateProjectResult {
  /** Проект прошёл структурную и доменную проверку */
  valid: boolean;
  /** Список ошибок и предупреждений */
  issues: ValidationIssue[];
}

/** Краткое описание типа ноды */
export interface NodeTypeInfo {
  /** Тип ноды, например "condition" */
  type: string;
  /** Краткое описание назначения */
  description: string;
}
