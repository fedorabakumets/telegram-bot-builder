/**
 * @fileoverview Валидация project.json через zod и доменные правила
 * @module lib/bot-tools/validate-project
 */

import { fromZodError } from 'zod-validation-error';
import { botDataWithSheetsSchema, nodeSchema } from '@shared/schema';
import { validateDomainRules } from './validate-domain.ts';
import type { ValidateProjectResult, ValidationIssue } from './types.ts';

/**
 * Валидирует полный project.json
 * @param projectJson - Объект или JSON-строка проекта
 * @returns Результат валидации
 */
export function validateBotProject(projectJson: unknown): ValidateProjectResult {
  const issues: ValidationIssue[] = [];
  let project: Record<string, unknown>;

  if (typeof projectJson === 'string') {
    try {
      project = JSON.parse(projectJson) as Record<string, unknown>;
    } catch {
      return { valid: false, issues: [{ severity: 'error', path: '$', message: 'Невалидный JSON', code: 'invalid_json' }] };
    }
  } else if (projectJson && typeof projectJson === 'object') {
    project = projectJson as Record<string, unknown>;
  } else {
    return { valid: false, issues: [{ severity: 'error', path: '$', message: 'Ожидается объект или JSON-строка', code: 'invalid_input' }] };
  }

  const parsed = botDataWithSheetsSchema.safeParse(project);
  if (!parsed.success) {
    const message = fromZodError(parsed.error, { prefix: null }).message;
    issues.push({
      severity: 'error',
      path: '$',
      message: `Структурная ошибка zod: ${message}`,
      code: 'zod_schema_error',
    });
  }

  issues.push(...validateDomainRules(project));

  const hasErrors = issues.some((i) => i.severity === 'error');
  return { valid: !hasErrors, issues };
}

/**
 * Валидирует одну ноду
 * @param type - Ожидаемый тип (опционально)
 * @param node - Объект ноды
 * @returns Результат валидации
 */
export function validateNode(type: string | undefined, node: unknown): ValidateProjectResult {
  const issues: ValidationIssue[] = [];

  if (!node || typeof node !== 'object') {
    return { valid: false, issues: [{ severity: 'error', path: '$', message: 'Ожидается объект ноды', code: 'invalid_input' }] };
  }

  const parsed = nodeSchema.safeParse(node);
  if (!parsed.success) {
    issues.push({
      severity: 'error',
      path: '$',
      message: fromZodError(parsed.error, { prefix: null }).message,
      code: 'zod_schema_error',
    });
  } else if (type && parsed.data.type !== type) {
    issues.push({
      severity: 'error',
      path: 'type',
      message: `Тип ноды ${parsed.data.type} не совпадает с ожидаемым ${type}`,
      code: 'type_mismatch',
    });
  }

  if (parsed.success) {
    const fakeProject = { version: 2, sheets: [{ id: 's1', name: 'Test', nodes: [parsed.data] }] };
    issues.push(...validateDomainRules(fakeProject));
  }

  return { valid: !issues.some((i) => i.severity === 'error'), issues };
}
