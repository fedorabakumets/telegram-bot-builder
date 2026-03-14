/**
 * @fileoverview Бочка для модуля node-handlers
 * 
 * Экспортирует все функции обработки узлов и генерации обработчиков.
 * 
 * @module bot-generator/node-handlers
 */

export { generateGotoHandler } from './generate-goto-handler';
export { generateSaveVariableHandler } from './generate-save-variable';
export { generateStickerHandler, generateVoiceHandler, generateAnimationHandler } from './generate-media-handlers';
export { generateLocationHandler, generateContactHandler } from './generate-location-contact-handlers';
export { newprocessNodeButtonsAndGenerateHandlers, createProcessNodeButtonsFunction } from './process-node-buttons';
