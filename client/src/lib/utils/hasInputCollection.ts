import { BotNode } from "../types/bot-node";

// Функция для проверки наличия узлов со сбором пользовательского ввода
export function hasInputCollection(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  // Проверяем узлы с collectUserInput
  const hasCollectInput = nodes.some(node => node.data.collectUserInput);

  // Проверяем узлы с enableTextInput
  const hasTextInput = nodes.some(node => node.data.enableTextInput);

  // Проверяем узлы с enablePhotoInput
  const hasPhotoInput = nodes.some(node => node.data.enablePhotoInput);

  // Проверяем узлы с enableVideoInput
  const hasVideoInput = nodes.some(node => node.data.enableVideoInput);

  // Проверяем узлы с enableAudioInput
  const hasAudioInput = nodes.some(node => node.data.enableAudioInput);

  // Проверяем узлы с enableDocumentInput
  const hasDocumentInput = nodes.some(node => node.data.enableDocumentInput);

  // Проверяем условные сообщения с waitForTextInput
  const hasConditionalInput = nodes.some(node => {
    const conditions = node.data.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;
    return conditions.some((cond: any) => cond.waitForTextInput);
  });

  return hasCollectInput || hasTextInput || hasPhotoInput || hasVideoInput || hasAudioInput || hasDocumentInput || hasConditionalInput;
}
