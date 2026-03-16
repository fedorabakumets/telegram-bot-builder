/**
 * @fileoverview Адаптер для создания контекста клавиатуры из Node данных
 * @module lib/bot-generator/Keyboard/createKeyboardContext
 */

import { Node } from '@shared/schema';
import { generateUniqueShortId } from '../format/generateUniqueShortId';
import type { KeyboardTemplateParams, Button, ConditionalMessage } from '../../templates/keyboard/keyboard.params';

/**
 * Контекст клавиатуры для передачи в Jinja2 шаблон
 */
export interface KeyboardContext extends KeyboardTemplateParams {
  /** Тип клавиатуры */
  keyboardType: 'inline' | 'reply' | 'none';
  /** Кнопки */
  buttons: Button[];
  /** Short ID узла для callback_data */
  shortNodeId: string;
}

/**
 * Создаёт контекст клавиатуры из данных узла
 *
 * @param node - Узел для генерации клавиатуры
 * @param allNodeIds - Массив всех ID узлов для генерации коротких ID
 * @returns Контекст для Jinja2 шаблона
 *
 * @example
 * ```typescript
 * const context = createKeyboardContext(node, allNodeIds);
 * const code = templateEngine.render('keyboard/keyboard.py.jinja2', context);
 * ```
 */
export function createKeyboardContext(
  node: Node,
  allNodeIds: string[] = []
): KeyboardContext {
  const nodeData = node.data || {};
  const shortNodeId = generateUniqueShortId(node.id, allNodeIds);

  return {
    keyboardType: nodeData.keyboardType || 'reply',
    buttons: nodeData.buttons || [],
    keyboardLayout: nodeData.keyboardLayout,
    resizeKeyboard: nodeData.resizeKeyboard !== false,
    oneTimeKeyboard: nodeData.oneTimeKeyboard === true,
    allowMultipleSelection: nodeData.allowMultipleSelection === true,
    multiSelectVariable: nodeData.multiSelectVariable || `multi_select_${node.id}`,
    nodeId: node.id,
    completeButton: nodeData.buttons?.find(btn => btn.action === 'complete'),
    enableConditionalMessages: nodeData.enableConditionalMessages === true,
    conditionalMessages: nodeData.conditionalMessages || [],
    hasImage: !!(nodeData.imageUrl && nodeData.imageUrl.trim()),
    imageUrl: nodeData.imageUrl,
    documentUrl: nodeData.documentUrl,
    videoUrl: nodeData.videoUrl,
    audioUrl: nodeData.audioUrl,
    parseMode: nodeData.formatMode === 'html' ? 'html' : 
               nodeData.formatMode === 'markdown' ? 'markdown' : 'none',
    indentLevel: '',
    allNodeIds,
    shortNodeId,
  };
}
