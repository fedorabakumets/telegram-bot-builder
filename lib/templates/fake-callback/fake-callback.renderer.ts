/**
 * @fileoverview Renderer для шаблона fake-callback
 * @module templates/fake-callback/fake-callback.renderer
 */

import type { FakeCallbackTemplateParams } from './fake-callback.params';
import { fakeCallbackParamsSchema } from './fake-callback.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код создания fake_callback для автоперехода.
 * @param params - Параметры fake callback
 * @returns Сгенерированный Python код
 */
export function generateFakeCallback(params: FakeCallbackTemplateParams): string {
  const validated = fakeCallbackParamsSchema.parse(params);
  return renderPartialTemplate('fake-callback/fake-callback.py.jinja2', validated);
}
