/**
 * HandlerGenerator - Генератор обработчиков для Telegram ботов
 * 
 * Отвечает за генерацию всех типов обработчиков:
 * - Обработчики сообщений
 * - Обработчики callback'ов (inline кнопки)
 * - Обработчики множественного выбора
 * - Обработчики медиа
 */

import { Node } from '../../../../shared/schema';
import { GenerationContext, IHandlerGenerator } from '../Core/types';
import {
  generateSynonymHandler,
  generateMessageSynonymHandler
} from '../Synonyms';
import {
  generateUserManagementSynonymHandler
} from '../UserHandler';
import {
  generateCommandHandler,
  generateStartHandler
} from '../CommandHandler';
import {
  generateStickerHandler,
  generateVoiceHandler,
  generateAnimationHandler,
  generateLocationHandler,
  generateContactHandler
} from '../MediaHandler';
import {
  generateInlineKeyboardCode,
  generateReplyKeyboardCode
} from '../Keyboard';
import {
  hasInlineButtons,
  hasAutoTransitions,
  hasMultiSelectNodes
} from '../has';
import {
  generateUniqueShortId
} from '../format';
import {
  generateConditionalMessageLogic
} from '../Conditional';

/**
 * Генератор обработчиков для различных типов узлов и взаимодействий
 */
export class HandlerGenerator implements IHandlerGenerator {
  
  /**
   * Генерирует обработчики сообщений для всех узлов
   */
  generateMessageHandlers(context: GenerationContext): string {
    const { nodes, userDatabaseEnabled } = context;
    let code = '';

    // Генерируем обработчики команд для каждого узла
    const commandNodes = (nodes || []).filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data.command
    );

    if (commandNodes.length > 0) {
      code += '\n# Обработчики команд\n';
      
      commandNodes.forEach(node => {
        code += `# @@NODE_START:${node.id}@@\n`;
        
        if (node.type === 'start') {
          code += generateStartHandler(node, userDatabaseEnabled);
        } else if (node.type === 'command') {
          code += generateCommandHandler(node, userDatabaseEnabled);
        }
        
        code += `# @@NODE_END:${node.id}@@\n`;
      });
    }

    // Генерируем обработчики синонимов
    code += this.generateSynonymHandlers(context);

    return code;
  }

  /**
   * Генерирует обработчики callback'ов для inline кнопок
   */
  generateCallbackHandlers(context: GenerationContext): string {
    const { nodes, connections } = context;
    let code = '';

    // Собираем узлы с inline кнопками
    const inlineNodes = (nodes || []).filter(node =>
      node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0
    );

    // Собираем все целевые узлы из различных источников
    const allReferencedNodeIds = this.collectReferencedNodeIds(nodes, connections);

    if (inlineNodes.length > 0 || allReferencedNodeIds.size > 0) {
      if (inlineNodes.length > 0) {
        code += '\n# Обработчики inline кнопок\n';
      } else {
        code += '\n# Обработчики автопереходов\n';
      }

      code += this.generateInlineButtonHandlers(context, inlineNodes, allReferencedNodeIds);
    }

    return code;
  }

  /**
   * Генерирует обработчики множественного выбора
   */
  generateMultiSelectHandlers(context: GenerationContext): string {
    const { nodes, allNodeIds } = context;
    let code = '';

    const multiSelectNodes = (nodes || []).filter(node => node.data.allowMultipleSelection);

    if (multiSelectNodes.length > 0) {
      code += '\n# Обработчики множественного выбора\n';
      code += this.generateMultiSelectLogic(context, multiSelectNodes);
    }

    return code;
  }

  /**
   * Генерирует обработчики медиа
   */
  generateMediaHandlers(context: GenerationContext): string {
    const { nodes } = context;
    let code = '';

    // Генерируем обработчики для различных типов медиа
    const mediaNodes = (nodes || []).filter(node => 
      ['sticker', 'voice', 'animation', 'location', 'contact'].includes(node.type)
    );

    if (mediaNodes.length > 0) {
      code += '\n# Обработчики медиа\n';
      
      mediaNodes.forEach(node => {
        code += `# @@NODE_START:${node.id}@@\n`;
        
        switch (node.type) {
          case 'sticker':
            code += generateStickerHandler(node);
            break;
          case 'voice':
            code += generateVoiceHandler(node);
            break;
          case 'animation':
            code += generateAnimationHandler(node);
            break;
          case 'location':
            code += generateLocationHandler(node);
            break;
          case 'contact':
            code += generateContactHandler(node);
            break;
        }
        
        code += `# @@NODE_END:${node.id}@@\n`;
      });
    }

    return code;
  }

  /**
   * Генерирует обработчики синонимов для всех узлов
   */
  private generateSynonymHandlers(context: GenerationContext): string {
    const { nodes } = context;
    let code = '';

    const nodesWithSynonyms = (nodes || []).filter(node =>
      node.data.synonyms && node.data.synonyms.length > 0
    );

    if (nodesWithSynonyms.length > 0) {
      code += '\n# Обработчики синонимов\n';
      
      nodesWithSynonyms.forEach(node => {
        if (node.data.synonyms) {
          node.data.synonyms.forEach((synonym: string) => {
            code += `# @@NODE_START:${node.id}@@\n`;

            if (node.type === 'start' || node.type === 'command') {
              code += generateSynonymHandler(node, synonym);
            } else if (['ban_user', 'unban_user', 'mute_user', 'unmute_user', 
                       'kick_user', 'promote_user', 'demote_user', 'admin_rights'].includes(node.type)) {
              code += generateUserManagementSynonymHandler(node, synonym);
            } else {
              code += generateMessageSynonymHandler(node, synonym);
            }

            code += `# @@NODE_END:${node.id}@@\n`;
          });
        }
      });
    }

    return code;
  }

  /**
   * Собирает все ID узлов, на которые есть ссылки
   */
  private collectReferencedNodeIds(nodes: Node[], connections: any[]): Set<string> {
    const allReferencedNodeIds = new Set<string>();

    // Добавляем узлы из inline кнопок
    const inlineNodes = (nodes || []).filter(node =>
      node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0
    );

    inlineNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.target) {
          allReferencedNodeIds.add(button.target);
        }
      });

      // Добавляем continueButtonTarget для multi-select узлов
      if (node.data.continueButtonTarget) {
        allReferencedNodeIds.add(node.data.continueButtonTarget);
      }
    });

    // Собираем кнопки из условных сообщений
    (nodes || []).forEach(node => {
      if (node.data.conditionalMessages) {
        node.data.conditionalMessages.forEach((condition: any) => {
          if (condition.buttons) {
            condition.buttons.forEach((button: any) => {
              if (button.action === 'goto' && button.target) {
                allReferencedNodeIds.add(button.target);
              }
            });
          }
        });
      }
    });

    // Добавляем узлы из inputTargetNodeId
    (nodes || []).forEach(node => {
      if (node.data.inputTargetNodeId) {
        allReferencedNodeIds.add(node.data.inputTargetNodeId);
      }
    });

    // Добавляем узлы из автопереходов
    (nodes || []).forEach(node => {
      if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
        allReferencedNodeIds.add(node.data.autoTransitionTo);
      }
    });

    // Добавляем все целевые узлы из соединений
    connections.forEach(connection => {
      if (connection.target) {
        allReferencedNodeIds.add(connection.target);
      }
    });

    return allReferencedNodeIds;
  }

  /**
   * Генерирует обработчики для inline кнопок
   */
  private generateInlineButtonHandlers(
    context: GenerationContext, 
    inlineNodes: Node[], 
    allReferencedNodeIds: Set<string>
  ): string {
    const { nodes } = context;
    let code = '';
    const processedCallbacks = new Set<string>();

    // Генерируем обработчики для каждой inline кнопки
    inlineNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.id) {
          const callbackData = button.id;

          // Избегаем дублирования обработчиков
          if (processedCallbacks.has(callbackData)) return;
          if (button.target && processedCallbacks.has(button.target)) return;

          const targetNode = button.target ? nodes.find(n => n.id === button.target) : null;
          const actualCallbackData = button.target || callbackData;

          // Отмечаем как обработанные
          processedCallbacks.add(callbackData);
          if (button.target) {
            processedCallbacks.add(button.target);
          }

          // Генерируем обработчик
          code += this.generateSingleCallbackHandler(context, actualCallbackData, targetNode);
        }
      });
    });

    return code;
  }

  /**
   * Генерирует отдельный обработчик callback'а
   */
  private generateSingleCallbackHandler(
    context: GenerationContext, 
    callbackData: string, 
    targetNode: Node | null
  ): string {
    const { nodes, allNodeIds } = context;
    let code = '';

    const safeFunctionName = callbackData.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Проверяем, нужен ли обработчик кнопки "done" для множественного выбора
    const isDoneHandlerNeeded = targetNode && targetNode.data.allowMultipleSelection && targetNode.data.continueButtonTarget;
    const shortNodeIdForDone = isDoneHandlerNeeded ? callbackData.slice(-10).replace(/^_+/, '') : '';

    // Генерируем декоратор
    if (isDoneHandlerNeeded) {
      code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}" or c.data.startswith("${callbackData}_btn_") or c.data == "multi_select_done_${shortNodeIdForDone}")\n`;
    } else {
      code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}" or c.data.startswith("${callbackData}_btn_"))\n`;
    }

    // Генерируем функцию обработчика
    code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
    code += '    # Безопасное получение данных из callback_query\n';
    code += '    try:\n';
    code += '        user_id = callback_query.from_user.id\n';
    code += '        callback_data = callback_query.data\n';
    code += `        logging.info(f"🔵 Вызван callback handler: handle_callback_${safeFunctionName} для пользователя {user_id}")\n`;
    code += '    except Exception as e:\n';
    code += `        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_${safeFunctionName}: {e}")\n`;
    code += '        return\n';
    code += '    \n';

    // Добавляем основную логику обработчика
    if (targetNode) {
      code += this.generateCallbackHandlerLogic(context, targetNode, callbackData);
    }

    return code;
  }

  /**
   * Генерирует основную логику обработчика callback'а
   */
  private generateCallbackHandlerLogic(
    context: GenerationContext, 
    targetNode: Node, 
    callbackData: string
  ): string {
    let code = '';

    code += '    await callback_query.answer()\n';
    code += '    \n';

    // Генерируем логику в зависимости от типа узла
    switch (targetNode.type) {
      case 'message':
        code += this.generateMessageNodeLogic(context, targetNode);
        break;
      case 'user-input':
        code += this.generateUserInputNodeLogic(context, targetNode);
        break;
      default:
        // Базовая логика для других типов узлов
        code += `    # Обработка узла типа ${targetNode.type}\n`;
        code += `    logging.info(f"Обработка узла {targetNode.id} типа ${targetNode.type}")\n`;
        break;
    }

    return code;
  }

  /**
   * Генерирует логику для узла типа message
   */
  private generateMessageNodeLogic(context: GenerationContext, node: Node): string {
    let code = '';

    // Проверяем наличие условных сообщений
    if (node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
      code += generateConditionalMessageLogic(node, context.userDatabaseEnabled, context.projectId);
    } else {
      // Обычное сообщение
      const messageText = node.data.message || 'Сообщение не задано';
      code += `    message_text = "${messageText.replace(/"/g, '\\"')}"\n`;
      code += '    \n';

      // Генерируем клавиатуру если есть
      if (node.data.buttons && node.data.buttons.length > 0) {
        if (node.data.keyboardType === 'inline') {
          code += generateInlineKeyboardCode(node.data.buttons, '    ', node.id, node.data, context.allNodeIds);
        } else {
          code += generateReplyKeyboardCode(node.data.buttons, '    ', node.id, node.data);
        }
      }

      code += '    await callback_query.message.edit_text(\n';
      code += '        message_text,\n';
      if (node.data.buttons && node.data.buttons.length > 0) {
        code += '        reply_markup=keyboard\n';
      }
      code += '    )\n';
    }

    return code;
  }

  /**
   * Генерирует логику для узла типа user-input
   */
  private generateUserInputNodeLogic(context: GenerationContext, node: Node): string {
    let code = '';

    code += `    # Узел сбора пользовательского ввода: ${node.id}\n`;
    
    if (context.userDatabaseEnabled) {
      code += '    # Сохраняем состояние ожидания ввода\n';
      code += `    await save_user_data_to_db(user_id, "waiting_for_input", "${node.id}")\n`;
    }

    const inputPrompt = node.data.inputPrompt || 'Введите данные:';
    code += `    await callback_query.message.edit_text("${inputPrompt.replace(/"/g, '\\"')}")\n`;

    return code;
  }

  /**
   * Генерирует логику множественного выбора
   */
  private generateMultiSelectLogic(context: GenerationContext, multiSelectNodes: Node[]): string {
    let code = '';

    // Генерируем обработчик для кнопок множественного выбора
    code += '\n@dp.callback_query(lambda c: c.data.startswith("multi_select_"))\n';
    code += 'async def handle_multi_select_callback(callback_query: types.CallbackQuery):\n';
    code += '    await callback_query.answer()\n';
    code += '    \n';
    code += '    callback_data = callback_query.data\n';
    code += '    user_id = callback_query.from_user.id\n';
    code += '    \n';

    // Логика обработки множественного выбора
    code += '    if callback_data.startswith("multi_select_done_"):\n';
    code += '        # Обработка кнопки "Готово"\n';
    code += '        short_node_id = callback_data.replace("multi_select_done_", "")\n';
    code += '        \n';

    // Находим полный node_id по короткому суффиксу
    code += '        # Находим полный node_id по короткому суффиксу\n';
    code += '        node_id = None\n';
    multiSelectNodes.forEach(node => {
      const shortNodeId = node.id.slice(-10).replace(/^_+/, '');
      code += `        if short_node_id == "${shortNodeId}":\n`;
      code += `            node_id = "${node.id}"\n`;
    });

    code += '        \n';
    code += '        if node_id:\n';
    code += '            # Переходим к следующему узлу\n';

    // Генерируем переходы для каждого узла
    multiSelectNodes.forEach(node => {
      if (node.data.continueButtonTarget) {
        code += `            if node_id == "${node.id}":\n`;
        const safeFunctionName = node.data.continueButtonTarget.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `                await handle_callback_${safeFunctionName}(callback_query)\n`;
      }
    });

    code += '    else:\n';
    code += '        # Обработка выбора элемента\n';
    code += '        # Логика добавления/удаления элемента из выбранных\n';
    code += '        pass\n';

    return code;
  }
}