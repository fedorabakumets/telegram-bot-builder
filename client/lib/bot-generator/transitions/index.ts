/**
 * @fileoverview Бочка для модуля transitions
 * 
 * Экспортирует все функции генерации переходов между узлами.
 * 
 * @module bot-generator/transitions
 */

export { generateAttachedMediaVars } from './generate-attached-media-vars';
export { generateButtonResponseConfig } from './generate-button-response-config';
export { generateConditionalBranch } from './generate-conditional-branch';
export { generateConditionalMessages } from './generate-conditional-messages';
export { generateErrorHandler } from './generate-error-handler';
export { generateFallbackNode } from './generate-fallback-node';
export { generateInlineKeyboardSend } from './generate-inline-keyboard-send';
export { generateInputWaitingSetup } from './generate-input-waiting-setup';
export { generateMediaPathResolve, type MediaType } from './generate-media-path-resolve';
export { generateMediaSaveVars } from './generate-media-save-vars';
export { generateMediaSend } from './generate-media-send';
export { generateNoNodesAvailableWarning, generateUnknownNextNodeWarning, generateUnknownNodeHandler } from './generate-unknown-node-handler';
export { generateParseMode } from './generate-parse-mode';
export { generateReplyKeyboardSend } from './generate-reply-keyboard-send';
export { generateTextSend } from './generate-text-send';
export { newgenerateStateTransitionAndRenderLogic } from './generate-state-transition-and-render-logic';
