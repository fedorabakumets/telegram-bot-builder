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
  const { nodeId, currentNode, connections } = params;
  
  let code = '';
  
  // Определяем необходимость переадресации
  const hasButtons = currentNode && currentNode.data?.buttons && currentNode.data.buttons.length > 0;
  const shouldRedirect = hasButtons && !(currentNode && currentNode.data?.allowMultipleSelection);
  
  code += `${indent}\n`;
  code += `${indent}# Определяем необходимость переадресации\n`;
  code += `${indent}hasButtons = ${hasButtons}\n`;
  code += `${indent}shouldRedirect = ${shouldRedirect}\n`;
  
  let redirectTarget = nodeId;
  
  if (shouldRedirect) {
    if (currentNode && currentNode.data?.continueButtonTarget) {
      redirectTarget = currentNode.data.continueButtonTarget;
    } else {
      const nodeConnections = connections.filter((conn: any) => conn && conn.source === nodeId);
      if (nodeConnections.length > 0) {
        redirectTarget = nodeConnections[0].target;
      }
    }
  }
  
  code += `${indent}redirectTarget = "${redirectTarget}"\n`;
  
  return code;
}
