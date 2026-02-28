/**
 * @fileoverview Бочка для модуля keyboard
 * 
 * Экспортирует функции генерации клавиатур.
 * 
 * @module bot-generator/transitions/keyboard
 */

export { generateRegularReplyKeyboard, type RegularReplyKeyboardParams } from './generate-regular-reply-keyboard';
export { generateRegularInlineKeyboard, type RegularInlineKeyboardParams } from './generate-regular-inline-keyboard';
export { generateConditionalKeyboardCheck } from './generate-conditional-keyboard-check';
