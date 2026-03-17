/**
 * @fileoverview Генерация кода для переходов между узлами и отправки сообщений
 * 
 * Модуль создаёт Python-код для обработки переходов между узлами схемы бота
 * и отправки соответствующих сообщений пользователю. Использует вспомогательные
 * функции для генерации кода отправки сообщений, обработки медиа, клавиатур и ввода.
 * 
 * @module bot-generator/transitions/generate-state-transition-and-render-logic
 */

import { formatTextForPython, generateWaitingStateCode, escapeForJsonString } from '../format';
import {
  generateButtonResponseConfig,
  generateFallbackNode,
  generateInlineKeyboardSend,
  generateMediaSaveVars,
  generateMediaSend,
  generateNoNodesAvailableWarning,
  generateParseMode,
  generateReplyKeyboardSend,
  generateTextSend,
  generateUnknownNextNodeWarning,
  generateUnknownNodeHandler
} from './index';
import { generateConditionalBranch as generateConditionalBranchTemplate } from '../../templates/conditional-branch/conditional-branch.renderer';
import { generateConditionalMessages as generateConditionalMessagesTemplate } from '../../templates/conditional-messages/conditional-messages.renderer';
import { generateErrorHandler as generateErrorHandlerTemplate } from '../../templates/error-handler/error-handler.renderer';
import { generateAttachedMediaVars as generateAttachedMediaVarsTemplate, buildAttachedMediaVarsParams } from '../../templates/attached-media-vars/attached-media-vars.renderer';

/**
 * Генерирует Python-код для переходов между узлами и отправки сообщений
 * 
 * @param nodes - Массив узлов для обработки
 * @param code - Текущий сгенерированный код
 * @param allNodeIds - Массив всех ID узлов
 * @param connections - Массив соединений между узлами
 * @returns Сгенерированный Python-код
 */
export function newgenerateStateTransitionAndRenderLogic(
  nodes: any[],
  code: string,
  allNodeIds: any[],
  connections: any[]
): string {
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      code += generateConditionalBranchTemplate({ index, nodeId: targetNode.id, indentLevel: '            ' });

      if (targetNode.type === 'message' && targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKeyboardSend(targetNode, '                ');
      } else if (targetNode.type === 'message' && targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateReplyKeyboardSend(targetNode, '                ');

        if (targetNode.data.enableTextInput || targetNode.data.collectUserInput ||
          targetNode.data.enablePhotoInput || targetNode.data.enableVideoInput ||
          targetNode.data.enableAudioInput || targetNode.data.enableDocumentInput) {
          if (targetNode && targetNode.data) {
            code += generateWaitingStateCode(targetNode, '                ');
          }
        }
      } else if (targetNode.type === 'message') {
        if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
          code += generateConditionalMessagesTemplate({
            conditionalMessages: targetNode.data.conditionalMessages,
            defaultText: targetNode.data.messageText || 'Сообщение',
            indentLevel: '                ',
          });
        } else {
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          code += `                text = ${formattedText}\n`;
        }

        code += generateParseMode(targetNode, '                ');
        code += generateMediaSaveVars(targetNode, '                ');
        code += generateAttachedMediaVarsTemplate(buildAttachedMediaVarsParams(targetNode, '                '));
        code += generateMediaSend(targetNode, '                ');

        if (!targetNode.data.imageUrl && !targetNode.data.videoUrl && !targetNode.data.audioUrl && !targetNode.data.documentUrl) {
          code += generateTextSend(targetNode, allNodeIds, '                ');
        }
      } else if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
        const inputPrompt = formatTextForPython(targetNode.data.messageText || targetNode.data.inputPrompt || "Введите ваш ответ:");
        const responseType = targetNode.data.responseType || 'text';

        code += `                prompt_text = "${escapeForJsonString(inputPrompt)}"\n`;
        const placeholder = targetNode.data.placeholder || "";
        if (placeholder) {
          code += `                placeholder_text = "${placeholder}"\n`;
          code += '                prompt_text += f"\\n\\n💡 {placeholder_text}"\n';
        }

        if (responseType === 'buttons' && targetNode.data.responseOptions && targetNode.data.responseOptions.length > 0) {
          code += generateButtonResponseConfig({
            node: targetNode,
            allNodeIds,
            connections,
            indent: '                '
          });
        } else {
          code += generateWaitingStateCode(targetNode, '                ');
        }
      } else if (targetNode.type === 'message') {
        code += generateFallbackNode(targetNode, '                ');
      } else {
        code += generateUnknownNodeHandler(targetNode.id, targetNode.type, '                ');
      }
    });

    code += generateUnknownNextNodeWarning('            ');
  } else {
    code += generateNoNodesAvailableWarning('            ');
  }

  code += generateErrorHandlerTemplate({ indentLevel: '        ' });
  return code;
}
