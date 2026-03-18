/**
 * @fileoverview Renderer универсальной замены переменных
 * @module templates/database/universal-variable-replacement.renderer
 */

import { SYSTEM_VARIABLE_SOURCES } from '@shared/system-variables-config';
import { renderPartialTemplate } from '../template-renderer';

export interface UniversalVariableReplacementParams {
  node?: any;
  indentLevel?: string;
}

/**
 * Генерирует код для универсальной замены переменных
 * @param codeLines - Массив строк кода для добавления
 * @param params - Параметры генерации (node, indentLevel) или строка отступа (обратная совместимость)
 */
export function generateUniversalVariableReplacement(
  codeLines: string[],
  params: UniversalVariableReplacementParams | string = {},
  _oldIndentLevel?: string
): void {
  let indent = '';
  let node: any = null;

  if (typeof params === 'string') {
    indent = params;
  } else {
    indent = params.indentLevel || '';
    node = params.node || null;
  }

  // Вычисляем usedVariables из текста сообщения
  const messageText = node?.data?.messageText || '';
  const usedVariables: string[] | undefined = messageText
    ? [...messageText.matchAll(/\{([^}|]+)(?:\|[^}]+)?\}/g)].map((m: RegExpMatchArray) => m[1])
    : undefined;

  // Подготавливаем sources для database-variables шаблона
  const sources = SYSTEM_VARIABLE_SOURCES.map(source => {
    const tableVariables = source.fields.map(f => f.variableName);
    const needed = !usedVariables || usedVariables.some(v => tableVariables.includes(v));
    return { ...source, needed };
  });

  const variableFiltersJson = (node?.data?.variableFilters)
    ? JSON.stringify(node.data.variableFilters)
    : null;

  const code = renderPartialTemplate('database/universal-variable-replacement.py.jinja2', {
    indent,
    sources,
    variableFiltersJson,
  });

  codeLines.push(code);
}
