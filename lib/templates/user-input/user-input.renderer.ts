/**
 * @fileoverview Renderer для шаблона сбора пользовательского ввода
 * @module templates/user-input/user-input.renderer
 */

import type { Node } from '@shared/schema';
import type { UserInputTemplateParams } from './user-input.params';
import { userInputParamsSchema } from './user-input.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код блока waiting_for_input из параметров (низкоуровневый API)
 */
export function generateUserInput(params: UserInputTemplateParams): string {
  const validated = userInputParamsSchema.parse(params);
  return renderPartialTemplate('user-input/user-input.py.jinja2', validated);
}

/**
 * Собирает UserInputTemplateParams из узла графа
 */
export function nodeToUserInputParams(node: Node): UserInputTemplateParams {
  const safeName = node.id.replace(/[^a-zA-Z0-9_]/g, '_');

  return {
    nodeId: node.id,
    safeName,
    inputVariable: node.data.inputVariable || 'user_response',
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
 */
export function generateUserInputFromNode(node: Node): string {
  return generateUserInput(nodeToUserInputParams(node));
}

/**
 * Проверяет, нужно ли генерировать блок сбора ввода для узла
 */
export function nodeHasUserInput(node: Node): boolean {
  return node.data.collectUserInput === true;
}
