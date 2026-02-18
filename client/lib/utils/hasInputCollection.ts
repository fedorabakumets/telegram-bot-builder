import { BotNode } from "../bot-generator";

// Функция для проверки наличия узлов со сбором пользовательского ввода
export function hasInputCollection(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  // Проверяем узлы с collectUserInput
  const hasCollectInput = nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => node.data?.collectUserInput);

  // Проверяем узлы с enableTextInput
  const hasTextInput = nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => node.data?.enableTextInput);

  // Проверяем узлы с enablePhotoInput
  const hasPhotoInput = nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => node.data?.enablePhotoInput);

  // Проверяем узлы с enableVideoInput
  const hasVideoInput = nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => node.data?.enableVideoInput);

  // Проверяем узлы с enableAudioInput
  const hasAudioInput = nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => node.data?.enableAudioInput);

  // Проверяем узлы с enableDocumentInput
  const hasDocumentInput = nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => node.data?.enableDocumentInput);

  // Проверяем условные сообщения с waitForTextInput
  const hasConditionalInput = nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => {
    const conditions = node.data?.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;
    return conditions.some((cond: any) => cond.waitForTextInput);
  });

  // Проверяем узлы с множественным выбором (multi-select)
  const hasMultiSelect = nodes
    .filter(node => node !== null && node !== undefined)
    .some(node => node.data?.allowMultipleSelection === true);

  return hasCollectInput || hasTextInput || hasPhotoInput || hasVideoInput || hasAudioInput || hasDocumentInput || hasConditionalInput || hasMultiSelect;
}
