/**
 * @fileoverview Генерация проверки skipDataCollection
 * Делегирует в Jinja2-шаблон templates/skip-data-collection
 * @module bot-generator/transitions/skip-data-collection/generate-skip-data-collection-check
 */

import { generateSkipDataCollectionCheck as _generate } from '../../../templates/skip-data-collection';

export function generateSkipDataCollectionCheck(
  variableName: string,
  variableValue: string,
  indent: string = '    '
): string {
  return _generate({ variableName, variableValue, indentLevel: indent });
}
