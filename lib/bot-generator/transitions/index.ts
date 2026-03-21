/**
 * @fileoverview Бочка для модуля transitions
 *
 * Экспортирует все функции генерации переходов между узлами.
 *
 * @module bot-generator/transitions
 */

// Прямые реэкспорты из Jinja2 шаблонов (без обёрток)
export { generateAttachedMediaVars, buildAttachedMediaVarsParams } from '../../templates/attached-media-vars';
export { generateConditionalBranch } from '../../templates/conditional-branch';
export { generateErrorHandler } from '../../templates/error-handler';
export { generateMediaPathResolve, type MediaType } from '../../templates/media-path-resolve';
export { generateMediaSaveVars, buildMediaSaveVarsParams } from '../../templates/media-save-vars';
export { generateMediaSend, buildMediaSendParams } from '../../templates/media-send';
export { generateParseMode, buildParseModeParams } from '../../templates/parse-mode';
export { generateAutoTransition, calculateAutoTransitionTarget } from '../../templates/auto-transition';
export {
  generateNavigateToNode,
  generateNavigateToNodeCall,
  generateNavigateToNodeWithText,
} from '../../templates/navigation';

// Локальные файлы с реальной логикой
export { generateButtonResponseConfig } from './generate-button-response-config';
export { generateConditionalMessages } from './generate-conditional-messages';
export { generateFallbackNode } from './generate-fallback-node';
export { generateInlineKeyboardSend } from './generate-inline-keyboard-send';
export { generateInteractiveCallbackHandlersWithConditionalMessagesMultiSelectAndAutoNavigation } from './generate-interactive-callback-handlers';
export { generateNoNodesAvailableWarning, generateUnknownNextNodeWarning, generateUnknownNodeHandler } from './generate-unknown-node-handler';
export { generateReplyKeyboardSend } from './generate-reply-keyboard-send';
export { generateTextSend } from './generate-text-send';
export { newgenerateStateTransitionAndRenderLogic } from './generate-state-transition-and-render-logic';

// Утилиты навигации без шаблонного аналога
export function generateNavigateToNodeWithVars(
  nodeId: string,
  userVarsVar: string,
  messageVar: string = 'message',
  indent: string = ''
): string {
  return `${indent}await navigate_to_node(${messageVar}, "${nodeId}", all_user_vars=${userVarsVar})\n`;
}

export function generateNavigateToNodeSafe(
  nodeId: string,
  indent: string = '',
  indentIn: string = '    '
): string {
  const safeFuncName = nodeId.replace(/-/g, '_').replace(/ /g, '_');
  const handlerFuncName = `handle_callback_${safeFuncName}`;
  return [
    `${indent}if "${nodeId}" == "${nodeId}":`,
    `${indent}${indentIn}if '${handlerFuncName}' in globals():`,
    `${indent}${indentIn}${indentIn}await ${handlerFuncName}(fake_callback)`,
    `${indent}${indentIn}else:`,
    `${indent}${indentIn}${indentIn}logging.warning(f"⚠️ Обработчик не найден для узла: ${nodeId}")`,
    `${indent}${indentIn}${indentIn}await message.answer("Переход завершен")`,
    '',
  ].join('\n');
}
