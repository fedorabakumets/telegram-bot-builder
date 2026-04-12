/**
 * @fileoverview Экспорт модуля клавиатуры
 * @module templates/keyboard/index
 */

export type { KeyboardTemplateParams, KeyboardType } from './keyboard.params';
export type { KeyboardParams } from './keyboard.schema';
export { keyboardParamsSchema } from './keyboard.schema';
export { generateKeyboard } from './keyboard.renderer';
export type { DynamicButtonsConfig, DynamicButtonsStyleMode } from './dynamic-buttons';
export { normalizeDynamicButtonsConfig, hasDynamicButtonsConfig, shouldUseDynamicButtons } from './dynamic-buttons';
export * from './keyboard.fixture';
