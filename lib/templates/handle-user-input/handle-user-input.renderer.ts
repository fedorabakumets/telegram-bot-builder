/**
 * @fileoverview Renderer для шаблона runtime-обработки пользовательского ввода
 * @module templates/handle-user-input/handle-user-input.renderer
 */

import type { HandleUserInputTemplateParams } from './handle-user-input.params';
import { handleUserInputParamsSchema } from './handle-user-input.schema';
import { renderPartialTemplate } from '../template-renderer';

function hasSkipDataCollectionButtons(nodes: HandleUserInputTemplateParams['nodes'] = []): boolean {
  return (nodes ?? []).some(node =>
    Array.isArray(node?.data?.buttons) &&
    node.data.buttons.some((button: any) => button?.skipDataCollection === true && !!button?.target)
  );
}

/**
 * Генерирует Python-код блока runtime-обработки пользовательского ввода.
 *
 * @param params - параметры шаблона
 * @returns Сгенерированный Python-код
 */
export function generateHandleUserInput(params: HandleUserInputTemplateParams = {}): string {
  const validated = handleUserInputParamsSchema.parse(params);
  return renderPartialTemplate('handle-user-input/handle-user-input.py.jinja2', {
    ...validated,
    hasSkipDataCollectionButtons:
      validated.hasSkipDataCollectionButtons ?? hasSkipDataCollectionButtons(validated.nodes),
  })
    .replace(/\n{3,}/g, '\n\n');
}
