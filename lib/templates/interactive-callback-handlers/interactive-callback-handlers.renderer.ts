/**
 * @fileoverview Renderer для шаблона interactive-callback-handlers
 *
 * Заменяет generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation
 * из bot-generator/transitions/generate-interactive-callback-handlers.ts
 *
 * @module templates/interactive-callback-handlers/interactive-callback-handlers.renderer
 */

import type { InteractiveCallbackHandlersTemplateParams } from './interactive-callback-handlers.params';
import { generateCallbackHandlerInit, buildCallbackHandlerInitParams } from '../callback-handler-init';
import { generateAutoTransition } from '../auto-transition';
import { calculateAutoTransitionTarget } from '../auto-transition';
import { generateAttachedMediaVars } from '../attached-media-vars';
import { isLoggingEnabled } from '../../bot-generator/core/logging';

/**
 * Генерирует интерактивные callback-обработчики для inline кнопок,
 * автопереходов и условных кнопок.
 *
 * @param params - Параметры генерации
 * @returns Сгенерированный Python-код
 */
export function generateInteractiveCallbackHandlers(
  params: InteractiveCallbackHandlersTemplateParams
): string {
  const {
    inlineNodes,
    allReferencedNodeIds,
    allConditionalButtons,
    nodes,
    allNodeIds,
    connections,
    userDatabaseEnabled,
    mediaVariablesMap,
    processNodeButtonsAndGenerateHandlers,
  } = params;

  if (
    inlineNodes.length === 0 &&
    allReferencedNodeIds.size === 0 &&
    allConditionalButtons.size === 0
  ) {
    return '';
  }

  let code = '';

  if (inlineNodes.length > 0 || allConditionalButtons.size > 0) {
    code += '\n# Обработчики inline кнопок\n';
  } else {
    code += '\n# Обработчики автопереходов\n';
  }

  const processedCallbacks = new Set<string>();
  processNodeButtonsAndGenerateHandlers(processedCallbacks);

  if (isLoggingEnabled()) {
    console.log(`🔍 ГЕНЕРАТОР: Обработка allReferencedNodeIds: ${Array.from(allReferencedNodeIds).join(', ')}`);
    console.log(`🔍 ГЕНЕРАТОР: Уже обработанные callbacks: ${Array.from(processedCallbacks).join(', ')}`);
  }

  allReferencedNodeIds.forEach(nodeId => {
    if (processedCallbacks.has(nodeId)) return;

    const targetNode = nodes.find((n: any) => n.id === nodeId);
    if (!targetNode) return;

    processedCallbacks.add(`cb_${nodeId}`);

    const shortNodeId = String(nodeId).slice(-10).replace(/^_+/, '');

    // Декоратор и заголовок обработчика
    code += `\n@dp.callback_query(lambda c: c.data == "${nodeId}")\n`;
    code += `async def handle_callback_${nodeId.replace(/[^a-zA-Z0-9_]/g, '_')}(callback_query: types.CallbackQuery):\n`;
    code += '    try:\n';
    code += '        user_id = callback_query.from_user.id\n';
    code += `        callback_data = callback_query.data\n`;
    code += `        logging.info(f"🔵 Callback: handle_callback_${shortNodeId} для пользователя {user_id}")\n`;
    code += '    except Exception as e:\n';
    code += `        logging.error(f"❌ Ошибка в handle_callback_${shortNodeId}: {e}")\n`;
    code += '        return\n';
    code += '    \n';

    // Инициализация callback обработчика
    // Проверяем: есть ли в любом узле кнопка с hideAfterClick=true, ведущая к этому nodeId
    const hasHideAfterClickIncoming = nodes.some((n: any) =>
      (n.data?.buttons || []).some((btn: any) => btn.hideAfterClick === true && btn.target === nodeId)
    );
    code += generateCallbackHandlerInit(buildCallbackHandlerInitParams(nodeId, targetNode, '    ', hasHideAfterClickIncoming));
    code += '    \n';

    // Переменные прикреплённых медиа
    if (targetNode.data?.attachedMedia?.length > 0 || targetNode.data?.imageUrl) {
      code += generateAttachedMediaVars({
        nodeId,
        attachedMedia: targetNode.data.attachedMedia || [],
        imageUrl: targetNode.data.imageUrl,
        videoUrl: targetNode.data.videoUrl,
        audioUrl: targetNode.data.audioUrl,
        documentUrl: targetNode.data.documentUrl,
        indentLevel: '    ',
      });
      code += '    \n';
    }

    // Автопереход
    const autoTransitionTarget = calculateAutoTransitionTarget(nodeId, targetNode.data, connections);
    if (autoTransitionTarget) {
      const targetExists = nodes.some((n: any) => n.id === autoTransitionTarget);
      code += generateAutoTransition({
        nodeId,
        autoTransitionTarget,
        targetExists,
        indentLevel: '    ',
      });
    }

    code += '    return\n';
  });

  return code;
}
