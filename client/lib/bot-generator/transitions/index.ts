/**
 * @fileoverview Бочка для модуля transitions
 * 
 * Экспортирует все функции генерации переходов между узлами.
 * 
 * @module bot-generator/transitions
 */

export { generateAttachedMediaVars } from './generate-attached-media-vars';
export { generateConditionalBranch } from './generate-conditional-branch';
export { generateConditionalMessages } from './generate-conditional-messages';
export { generateInlineKeyboardSend } from './generate-inline-keyboard-send';
export { generateMediaPathResolve, type MediaType } from './generate-media-path-resolve';
export { generateMediaSaveVars } from './generate-media-save-vars';
export { generateMediaSend } from './generate-media-send';
export { generateParseMode } from './generate-parse-mode';
export { generateReplyKeyboardSend } from './generate-reply-keyboard-send';
export { generateTextSend } from './generate-text-send';
