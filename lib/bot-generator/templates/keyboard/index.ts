/**
 * @fileoverview Экспорт модуля клавиатуры
 * @module templates/keyboard/index
 */

export type { KeyboardTemplateParams, KeyboardType } from './keyboard.params';
export type { KeyboardParams } from './keyboard.schema';
export { keyboardParamsSchema } from './keyboard.schema';
export { generateKeyboard } from './keyboard.renderer';
export * from './keyboard.fixture';
