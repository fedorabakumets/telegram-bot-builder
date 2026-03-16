/**
 * @fileoverview Обработка кнопок узлов и генерация обработчиков callback
 *
 * Модуль создаёт Python-код для обработки кнопок inline-узлов,
 * генерирует обработчики callback-запросов и управляет навигацией между узлами.
 *
 * @module bot-generator/node-handlers/process-node-buttons
 */

// Примечание: следующие импорты удалены после миграции на Jinja2:
// import { generateCommandNodeHandlerWithKeyboardAndImageSupport } from '../CommandHandler/generateCommandNodeHandlerWithKeyboardAndImageSupport';
// import { generateStartNodeHandlerWithConditionalLogicAndImages } from '../CommandHandler/generateStartNodeHandlerWithConditionalLogicAndImages';
// import { createFakeMessageEditForCallback } from '../Keyboard/createFakeMessageEditForCallback';
// import { generateMessageNodeHandlerWithKeyboardAndInputCollection } from '../MessageHandlers/generateMessageNodeHandlerWithKeyboardAndInputCollection';
// import { generateMessageNodeHandlerWithConditionalLogicAndMediaSupport } from '../Conditional/generateMessageNodeHandlerWithConditionalLogicAndMediaSupport';
// import { generateStickerHandler, generateVoiceHandler, generateAnimationHandler } from './generate-media-handlers';
// import { generateLocationHandler, generateContactHandler } from './generate-location-contact-handlers';
import { generateMultiSelectButtonHandler } from '../../templates/handlers';
import { generateGotoHandler } from './generate-goto-handler';
import { generateSaveVariableHandler } from './generate-save-variable';

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
        code += generateMultiSelectButtonHandler({
          targetNode,
          callbackData: actualCallbackData,
          button,
          node,
          nodes,
          indentLevel: '',
        });

        if (targetNode) {
          // Обработка save_variable
          if (targetNode.type === 'message' && targetNode.data.action === 'save_variable') {
            code += generateSaveVariableHandler(targetNode);
          }
          // Обработка message узлов - обработчик уже сгенерирован в generateNodeHandlers
          // Просто вызываем существующий handle_callback_XXX
          else if (targetNode.type === 'message') {
            const safeNodeId = actualNodeId.replace(/-/g, '_');
            code += `    # Message node handler уже сгенерирован в generateNodeHandlers\n`;
            code += `    # Вызываем существующий обработчик через handle_callback_${safeNodeId}\n`;
            // Примечание: навигация к targetNode будет выполнена через вызов handle_callback_XXX
            // который уже сгенерирован в generate-node-handlers.ts через message.py.jinja2
          }
          // Обработка sticker, voice, animation, location, contact узлов
          // Обработчики уже сгенерированы в generateNodeHandlers
          else if (targetNode.type === 'sticker' || targetNode.type === 'voice' || 
                   targetNode.type === 'animation' || targetNode.type === 'location' || 
                   targetNode.type === 'contact') {
            code += `    # ${targetNode.type} node handler уже сгенерирован в generateNodeHandlers\n`;
          }
          // Обработка start узлов - удалено после миграции на Jinja2
          // start и command узлы теперь используют шаблоны:
          // - lib/templates/start/start.py.jinja2
          // - lib/templates/command/command.py.jinja2
          else if (targetNode.type === 'start') {
            // Примечание: обработчики для start узлов теперь генерируются через Jinja2 шаблоны
            // в generate-new-node-handlers.ts
            code += `    # Start node handler generated via Jinja2 template\n`;
          }
          // Обработка command узлов - удалено после миграции на Jinja2
          else if (targetNode.type === 'command') {
            // Примечание: обработчики для command узлов теперь генерируются через Jinja2 шаблоны
            // в generate-new-node-handlers.ts
            code += `    # Command node handler generated via Jinja2 template\n`;
          }
          // Неизвестный тип узла
          else {
            code += `    # Нет обработчика для узла типа ${targetNode.type}\n`;
          }
        } else {
          // Кнопка без цели
          code += '    # Кнопка пока никуда не ведет\n';
          code += '    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)\n';
        }
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
