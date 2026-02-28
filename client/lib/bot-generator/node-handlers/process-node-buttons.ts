/**
 * @fileoverview Обработка кнопок узлов и генерация обработчиков callback
 * 
 * Модуль создаёт Python-код для обработки кнопок inline-узлов,
 * генерирует обработчики callback-запросов и управляет навигацией между узлами.
 * 
 * @module bot-generator/node-handlers/process-node-buttons
 */

import { Button, isLoggingEnabled } from '../../bot-generator';
import { generateCommandNodeHandlerWithKeyboardAndImageSupport } from '../../CommandHandler/generateCommandNodeHandlerWithKeyboardAndImageSupport';
import { generateStartNodeHandlerWithConditionalLogicAndImages } from '../../CommandHandler/generateStartNodeHandlerWithConditionalLogicAndImages';
import { generateMessageNodeHandlerWithConditionalLogicAndMediaSupport } from '../../Conditional/generateMessageNodeHandlerWithConditionalLogicAndMediaSupport';
import { generateButtonText } from '../format';
import { createFakeMessageEditForCallback } from '../Keyboard/createFakeMessageEditForCallback';
import { generateCommandButtonCallbackHandler } from '../Keyboard/generateCommandButtonCallbackHandler';
import { generateMultiSelectButtonHandlerWithVariableSaving } from '../Keyboard/generateMultiSelectButtonHandlerWithVariableSaving';
import { generateMessageNodeHandlerWithKeyboardAndInputCollection } from '../../MessageHandlers/generateMessageNodeHandlerWithKeyboardAndInputCollection';
import { generateGotoHandler } from './generate-goto-handler';
import { generateSaveVariableHandler } from './generate-save-variable';
import { generateStickerHandler, generateVoiceHandler, generateAnimationHandler } from './generate-media-handlers';
import { generateLocationHandler, generateContactHandler } from './generate-location-contact-handlers';

/**
 * Обрабатывает кнопки узлов и генерирует обработчики callback-запросов
 * 
 * @param inlineNodes - Массив inline-узлов
 * @param processedCallbacks - Set обработанных callback_data
 * @param nodes - Массив всех узлов
 * @param code - Текущий сгенерированный код
 * @param allNodeIds - Массив всех ID узлов
 * @param connections - Массив соединений
 * @param mediaVariablesMap - Карта медиа-переменных
 * @returns Сгенерированный Python-код
 */
export function newprocessNodeButtonsAndGenerateHandlers(
  inlineNodes: any[],
  processedCallbacks: Set<string>,
  nodes: any[],
  code: string,
  allNodeIds: any[],
  connections: any[],
  mediaVariablesMap: Map<string, { type: string; variable: string; }>
): string {
  inlineNodes.forEach(node => {
    node.data.buttons.forEach((button: any) => {
      // Обработка кнопок с действием 'goto'
      if (button.action === 'goto' && button.id) {
        const gotoResult = generateGotoHandler(button, nodes, processedCallbacks);
        
        if (!gotoResult || gotoResult.shouldSkip) {
          return;
        }

        const { targetNode, actualCallbackData, actualNodeId } = gotoResult;

        // Обработка множественного выбора
        code = generateMultiSelectButtonHandlerWithVariableSaving(
          targetNode, 
          actualCallbackData, 
          code, 
          nodes, 
          button, 
          node
        );

        if (targetNode) {
          // Обработка save_variable
          if (targetNode.type === 'message' && targetNode.data.action === 'save_variable') {
            code += generateSaveVariableHandler(targetNode);
          }
          // Обработка message узлов
          else if (targetNode.type === 'message') {
            code = generateMessageNodeHandlerWithConditionalLogicAndMediaSupport(
              targetNode, 
              code, 
              allNodeIds, 
              connections, 
              mediaVariablesMap, 
              actualNodeId
            );
          }
          // Обработка sticker узлов
          else if (targetNode.type === 'sticker') {
            code += generateStickerHandler(targetNode);
          }
          // Обработка voice узлов
          else if (targetNode.type === 'voice') {
            code += generateVoiceHandler(targetNode);
          }
          // Обработка animation узлов
          else if (targetNode.type === 'animation') {
            code += generateAnimationHandler(targetNode);
          }
          // Обработка location узлов
          else if (targetNode.type === 'location') {
            code += generateLocationHandler(targetNode);
          }
          // Обработка contact узлов
          else if (targetNode.type === 'contact') {
            code += generateContactHandler(targetNode);
          }
          // Обработка start узлов
          else if (targetNode.type === 'start') {
            code = generateStartNodeHandlerWithConditionalLogicAndImages(
              targetNode, 
              code, 
              actualNodeId
            ).join('\n');
          }
          // Обработка command узлов
          else if (targetNode.type === 'command') {
            code += generateCommandNodeHandlerWithKeyboardAndImageSupport(
              targetNode, 
              actualNodeId
            );
          }
          // Универсальный обработчик
          else {
            code = generateMessageNodeHandlerWithKeyboardAndInputCollection(
              code, 
              targetNode, 
              actualNodeId, 
              allNodeIds
            );
          }
        } else {
          // Кнопка без цели
          code += '    # Кнопка пока никуда не ведет\n';
          code += '    await callback_query.answer("⚠️ Эта кнопка яока не настроена", show_alert=True)\n';
        }
      }
      // Обработка кнопок с действием 'command'
      else if (button.action === 'command' && button.id) {
        const callbackData = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;

        if (processedCallbacks.has(callbackData)) {
          return;
        }
        processedCallbacks.add(callbackData);

        code = generateCommandButtonCallbackHandler(code, callbackData, button);
        code = createFakeMessageEditForCallback(button, code);
      }
    });
  });

  return code;
}

/**
 * Создаёт функцию для обработки кнопок узлов
 * 
 * @param inlineNodes - Массив inline-узлов
 * @param nodes - Массив всех узлов
 * @param code - Начальный код
 * @param allNodeIds - Массив всех ID узлов
 * @param connections - Массив соединений
 * @param mediaVariablesMap - Карта медиа-переменных
 * @returns Функция для обработки кнопок
 */
export function createProcessNodeButtonsFunction(
  inlineNodes: any[],
  nodes: any[],
  code: string,
  allNodeIds: any[],
  connections: any[],
  mediaVariablesMap: Map<string, { type: string; variable: string; }>
): (processedCallbacks: Set<string>) => string {
  return function processNodeButtonsAndGenerateHandlers(
    processedCallbacks: Set<string>
  ): string {
    return newprocessNodeButtonsAndGenerateHandlers(
      inlineNodes,
      processedCallbacks,
      nodes,
      code,
      allNodeIds,
      connections,
      mediaVariablesMap
    );
  };
}
