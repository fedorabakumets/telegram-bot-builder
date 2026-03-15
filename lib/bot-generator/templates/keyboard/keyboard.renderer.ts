/**
 * @fileoverview Функция рендеринга шаблона клавиатуры
 * @module templates/keyboard/keyboard.renderer
 */

import type { KeyboardTemplateParams } from './keyboard.params';
import { keyboardParamsSchema } from './keyboard.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python кода клавиатуры с валидацией параметров
 * @param params - Параметры клавиатуры
 * @returns Сгенерированный Python код
 *
 * @example
 * ```typescript
 * const code = generateKeyboard({
 *   keyboardType: 'inline',
 *   buttons: [
 *     { text: 'Button', action: 'callback', target: 'btn', id: 'btn_1' },
 *   ],
 *   oneTimeKeyboard: false,
 *   resizeKeyboard: true,
 * });
 * ```
 */
export function generateKeyboard(params: KeyboardTemplateParams): string {
  const validated = keyboardParamsSchema.parse({
    ...params,
    keyboardType: params.keyboardType ?? 'none',
    oneTimeKeyboard: params.oneTimeKeyboard ?? false,
    resizeKeyboard: params.resizeKeyboard ?? true,
  });
  return renderPartialTemplate('keyboard/keyboard.py.jinja2', validated);
}
