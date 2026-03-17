/**
 * @fileoverview Renderer для шаблона сбора пользовательского ввода
 * @module templates/user-input/user-input.renderer
 */

import type { Node } from '@shared/schema';
import type { UserInputTemplateParams } from './user-input.params';
import { userInputParamsSchema } from './user-input.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Вычисляет список принимаемых режимов ввода из параметров
 */
function buildModes(params: UserInputTemplateParams): string[] {
  // Кнопочный ввод
  if (params.inputType === 'button') {
    return params.enableTextInput ? ['button', 'text'] : ['button'];
  }
  // Медиа/текстовый ввод
  const modes: string[] = [];
  if (params.enableTextInput !== false) modes.push('text');
  if (params.enablePhotoInput) modes.push('photo');
  if (params.enableVideoInput) modes.push('video');
  if (params.enableAudioInput) modes.push('audio');
  if (params.enableDocumentInput) modes.push('document');
  return modes.length > 0 ? modes : ['text'];
}

/**
 * Генерирует Python-код блока waiting_for_input из параметров (низкоуровневый API)
 * @param params - параметры шаблона
 * @param indentLevel - отступ для каждой строки (по умолчанию '    ')
 */
export function generateUserInput(params: UserInputTemplateParams, indentLevel: string = '    '): string {
  const validated = userInputParamsSchema.parse(params);
  const modes = buildModes(validated);
  const raw = renderPartialTemplate('user-input/user-input.py.jinja2', { ...validated, modes });
  if (indentLevel === '    ') return raw;
  // Переиндентируем: каждая непустая строка получает нужный отступ вместо 4 пробелов
  return raw
    .split('\n')
    .map(line => line.startsWith('    ') ? indentLevel + line.slice(4) : line)
    .join('\n');
}

/**
 * Собирает UserInputTemplateParams из узла графа
 */
export function nodeToUserInputParams(node: Node): UserInputTemplateParams {
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  return {
    nodeId: node.id,
    safeName,
    inputVariable: node.data.inputVariable || 'input',
    appendVariable: node.data.appendVariable ?? false,
    inputTargetNodeId: node.data.inputTargetNodeId || '',
    enableTextInput: node.data.enableTextInput ?? true,
    enablePhotoInput: node.data.enablePhotoInput ?? false,
    photoInputVariable: node.data.photoInputVariable || '',
    enableVideoInput: node.data.enableVideoInput ?? false,
    videoInputVariable: node.data.videoInputVariable || '',
    enableAudioInput: node.data.enableAudioInput ?? false,
    audioInputVariable: node.data.audioInputVariable || '',
    enableDocumentInput: node.data.enableDocumentInput ?? false,
    documentInputVariable: node.data.documentInputVariable || '',
    inputType: (node.data.buttons?.length > 0 && node.data.collectUserInput) ? 'button' : 'text',
    skipButtons: (node.data.buttons || [])
      .filter((btn: any) => btn.skipDataCollection === true && btn.target)
      .map((btn: any) => ({ text: btn.text, target: btn.target })),
    validationType: (node.data.validationType as UserInputTemplateParams['validationType']) ?? 'none',
    minLength: node.data.minLength ?? 0,
    maxLength: node.data.maxLength ?? 0,
    retryMessage: node.data.retryMessage || 'Пожалуйста, попробуйте еще раз.',
    successMessage: node.data.successMessage || '',
    saveToDatabase: node.data.saveToDatabase ?? true,
  };
}

/**
 * Генерирует Python-код блока waiting_for_input из узла графа (высокоуровневый API)
 * @param node - узел графа
 * @param indentLevel - отступ для каждой строки (по умолчанию '    ')
 */
export function generateUserInputFromNode(node: Node, indentLevel: string = '    '): string {
  return generateUserInput(nodeToUserInputParams(node), indentLevel);
}

/**
 * Проверяет, нужно ли генерировать блок сбора ввода для узла
 */
export function nodeHasUserInput(node: Node): boolean {
  return node.data.collectUserInput === true;
}
