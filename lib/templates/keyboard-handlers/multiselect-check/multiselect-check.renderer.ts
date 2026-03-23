/**
 * @fileoverview Renderer для шаблона проверки множественного выбора
 * @module templates/multiselect-check/multiselect-check.renderer
 */

import type { MultiSelectCheckTemplateParams, MultiSelectNode } from './multiselect-check.params';
import { multiSelectCheckParamsSchema } from './multiselect-check.schema';
import { renderPartialTemplate } from '../../template-renderer';

/** Предобработанный узел для шаблона */
interface PreparedMultiSelectNode {
  id: string;
  safeName: string;
  type: string;
  continueText: string;
  variableName: string;
  continueButtonTarget: string | null;
  targetNode: PreparedMultiSelectNode | null;
  selectionButtons: Array<{ text: string; safeName: string }>;
  completeButton: { text: string } | null;
  regularButtons: Array<{ text: string }>;
  gotoButtons: Array<{ text: string; target: string; targetNode: PreparedMultiSelectNode | null }>;
  messageText: string;
  resizeKeyboard: boolean;
  oneTimeKeyboard: boolean;
  keyboardType: string;
  buttons: Array<{ id: string; text: string; action: string; target?: string }>;
  allowMultipleSelection: boolean;
}

/**
 * Генерирует Python-код проверки состояния множественного выбора.
 *
 * Включает:
 * - проверку multi_select_node
 * - обработку кнопки "Готово"
 * - toggle-логику кнопок выбора
 * - goto-навигацию в режиме multiselect
 */
export function generateMultiSelectCheck(params: MultiSelectCheckTemplateParams): string {
  const validated = multiSelectCheckParamsSchema.parse(params);

  // Предобрабатываем узлы для шаблона
  const prepareNode = (n: MultiSelectNode): PreparedMultiSelectNode => {
    const buttons = n.data.buttons || [];
    const completeBtn = buttons.find(b => b.action === 'complete') || null;
    const continueText = completeBtn?.text || n.data.continueButtonText || 'Готово';
    const variableName = n.data.multiSelectVariable || `multi_select_${n.id}`;
    const selectionButtons = buttons
      .filter(b => b.action === 'selection')
      .map(b => ({ text: b.text, safeName: b.id.replace(/[^a-zA-Z0-9_]/g, '_') }));
    const regularButtons = buttons
      .filter(b => b.action !== 'selection' && b.action !== 'complete')
      .map(b => ({ text: b.text }));
    const gotoButtons = buttons
      .filter(b => b.action === 'goto' && b.target)
      .map(b => ({
        text: b.text,
        target: b.target!,
        targetNode: null as PreparedMultiSelectNode | null,
      }));

    return {
      id: n.id,
      safeName: n.safeName,
      type: n.type,
      continueText,
      variableName,
      continueButtonTarget: n.data.continueButtonTarget || null,
      targetNode: null,
      selectionButtons,
      completeButton: completeBtn ? { text: completeBtn.text } : null,
      regularButtons,
      gotoButtons,
      messageText: n.data.messageText || 'Выберите опции:',
      resizeKeyboard: n.data.resizeKeyboard !== false,
      oneTimeKeyboard: n.data.oneTimeKeyboard === true,
      keyboardType: n.data.keyboardType || 'reply',
      buttons,
      allowMultipleSelection: n.data.allowMultipleSelection === true,
    };
  };

  const preparedNodes = validated.nodes.map(prepareNode);

  // Связываем targetNode и gotoButtons.targetNode
  for (const node of preparedNodes) {
    if (node.continueButtonTarget) {
      node.targetNode = preparedNodes.find(n => n.id === node.continueButtonTarget) || null;
    }
    for (const gotoBtn of node.gotoButtons) {
      gotoBtn.targetNode = preparedNodes.find(n => n.id === gotoBtn.target) || null;
    }
  }

  return renderPartialTemplate('multiselect-check/multiselect-check.py.jinja2', {
    nodes: preparedNodes,
    allNodeIds: validated.allNodeIds,
    indentLevel: validated.indentLevel,
  });
}

/**
 * Собирает MultiSelectNode[] из массива узлов графа
 */
export function collectMultiSelectNodes(nodes: any[]): MultiSelectNode[] {
  return (nodes || [])
    .filter(n => n != null && n.id)
    .map(n => ({
      id: n.id,
      safeName: n.id.replace(/[^a-zA-Z0-9_]/g, '_'),
      type: n.type || 'message',
      data: n.data || {},
    }));
}
