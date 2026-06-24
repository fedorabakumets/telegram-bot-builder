/**
 * @fileoverview Доменные правила валидации project.json
 * @module lib/bot-tools/validate-domain
 */

import type { Node } from '@shared/schema';
import { CONDITION_OPERATORS, NODE_TYPES } from './constants.ts';
import { collectAllNodes, collectNodeTransitions } from './collect-nodes.ts';
import type { ValidationIssue } from './types.ts';

/**
 * Проверяет доменные правила поверх zod-структуры
 * @param project - Распарсенный project.json
 * @returns Список ошибок и предупреждений
 */
export function validateDomainRules(project: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entries = collectAllNodes(project);
  const idCounts = new Map<string, number>();
  const nodeIds = new Set<string>();

  for (const { node, sheetId } of entries) {
    nodeIds.add(node.id);
    idCounts.set(node.id, (idCounts.get(node.id) ?? 0) + 1);

    if (!NODE_TYPES.includes(node.type as typeof NODE_TYPES[number])) {
      issues.push({
        severity: 'error',
        path: `sheets[].nodes[id=${node.id}].type`,
        message: `Неизвестный тип ноды: ${node.type}`,
        code: 'unknown_node_type',
      });
    }

    validateConditionNode(node, sheetId, issues);
    validateForbiddenConditionFormat(node, issues);
  }

  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({
        severity: 'error',
        path: `nodes[id=${id}]`,
        message: `Дублирующийся id ноды: ${id} (встречается ${count} раз)`,
        code: 'duplicate_node_id',
      });
    }
  }

  for (const { node, sheetId } of entries) {
    for (const { label, target } of collectNodeTransitions(node)) {
      if (!nodeIds.has(target)) {
        issues.push({
          severity: 'error',
          path: `sheets[${sheetId}].nodes[id=${node.id}].${label}`,
          message: `Ссылка на несуществующую ноду: ${target}`,
          code: 'broken_target',
        });
      }
    }
  }

  const hasStart = entries.some(({ node }) => node.type === 'start' || node.type === 'command_trigger');
  if (!hasStart && entries.length > 0) {
    issues.push({
      severity: 'warning',
      path: 'sheets',
      message: 'Нет start или command_trigger — бот может не иметь точки входа',
      code: 'no_entry_node',
    });
  }

  if (entries.length === 0) {
    issues.push({
      severity: 'warning',
      path: 'sheets',
      message: 'Проект не содержит нод',
      code: 'empty_project',
    });
  }

  return issues;
}

/**
 * Проверяет condition-ноду на корректность branches
 * @param node - Узел
 * @param sheetId - ID листа
 * @param issues - Массив для накопления проблем
 */
function validateConditionNode(node: Node, sheetId: string, issues: ValidationIssue[]): void {
  if (node.type !== 'condition') return;

  const branches = node.data?.branches ?? [];
  if (branches.length === 0) {
    issues.push({
      severity: 'error',
      path: `sheets[${sheetId}].nodes[id=${node.id}].data.branches`,
      message: 'condition-нода должна содержать массив branches',
      code: 'condition_no_branches',
    });
    return;
  }

  const hasElse = branches.some((b) => b.operator === 'else');
  if (!hasElse) {
    issues.push({
      severity: 'error',
      path: `sheets[${sheetId}].nodes[id=${node.id}].data.branches`,
      message: 'condition-нода должна иметь ветку с operator: "else"',
      code: 'condition_missing_else',
    });
  }

  for (let i = 0; i < branches.length; i++) {
    const op = branches[i].operator;
    if (!CONDITION_OPERATORS.includes(op as typeof CONDITION_OPERATORS[number])) {
      issues.push({
        severity: 'error',
        path: `sheets[${sheetId}].nodes[id=${node.id}].data.branches[${i}].operator`,
        message: `Недопустимый оператор: ${op}`,
        code: 'invalid_operator',
      });
    }
  }
}

/**
 * Ловит галлюцинации ИИ: conditions + defaultTarget
 * @param node - Узел
 * @param issues - Массив проблем
 */
function validateForbiddenConditionFormat(node: Node, issues: ValidationIssue[]): void {
  if (node.type !== 'condition') return;
  const data = node.data as Record<string, unknown>;
  if ('conditions' in data || 'defaultTarget' in data) {
    issues.push({
      severity: 'error',
      path: `nodes[id=${node.id}].data`,
      message: 'Неверный формат condition: используйте branches, а не conditions/defaultTarget',
      code: 'condition_wrong_format',
    });
  }
}
