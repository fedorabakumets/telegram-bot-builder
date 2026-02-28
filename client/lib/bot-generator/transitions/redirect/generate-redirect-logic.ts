/**
 * @fileoverview Генерация логики переадресации
 * 
 * Модуль создаёт Python-код для определения целевого узла
 * переадресации после обработки кнопки.
 * 
 * @module bot-generator/transitions/redirect/generate-redirect-logic
 */

/**
 * Параметры для генерации переадресации
 */
export interface RedirectLogicParams {
  nodeId: string;
  currentNode: any;
  connections: any[];
  shouldRedirect: boolean;
  redirectTarget: string;
}

/**
 * Генерирует Python-код для логики переадресации
 * 
 * @param params - Параметры переадресации
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateRedirectLogic(
  params: RedirectLogicParams,
  indent: string = '    '
): string {
  const { nodeId, currentNode, shouldRedirect, redirectTarget } = params;
  
  let code = '';
  
  code += `${indent}\n`;
  code += `${indent}# Определяем необходимость переадресации\n`;
  code += `${indent}# hasButtons = ${shouldRedirect}\n`;
  code += `${indent}redirectTarget = "${redirectTarget}"\n`;
  
  return code;
}
