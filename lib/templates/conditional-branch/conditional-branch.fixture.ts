/**
 * @fileoverview Тестовые данные для шаблона conditional-branch
 * @module templates/conditional-branch/conditional-branch.fixture
 */

import type { ConditionalBranchTemplateParams } from './conditional-branch.params';

/** Валидные параметры: первый узел (if) */
export const validParamsFirst: ConditionalBranchTemplateParams = {
  index: 0,
  nodeId: 'node_abc',
};

/** Валидные параметры: второй узел (elif) */
export const validParamsSecond: ConditionalBranchTemplateParams = {
  index: 1,
  nodeId: 'node_xyz',
};

/** Валидные параметры: с кастомным отступом */
export const validParamsWithIndent: ConditionalBranchTemplateParams = {
  index: 0,
  nodeId: 'node_custom',
  indentLevel: '    ',
};

/** Ожидаемый вывод: if ветка */
export const expectedOutputIf = 'if next_node_id == "node_abc":';

/** Ожидаемый вывод: elif ветка */
export const expectedOutputElif = 'elif next_node_id == "node_xyz":';
