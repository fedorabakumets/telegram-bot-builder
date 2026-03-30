/**
 * @fileoverview Функция рендеринга шаблона универсальных обработчиков
 * @module templates/universal-handlers/universal-handlers.renderer
 */

import type { UniversalHandlersTemplateParams } from './universal-handlers.params';
import { universalHandlersParamsSchema } from './universal-handlers.schema';
import { renderPartialTemplate } from '../template-renderer';

function hasSkipDataCollectionButtons(nodes: any[] = []): boolean {
  const hasSkip = (buttons: any[] | undefined) =>
    Array.isArray(buttons) && buttons.some(button => button?.skipDataCollection === true && !!button?.target);

  return (nodes ?? []).some(node =>
    hasSkip(node?.data?.buttons) ||
    (node?.data?.conditionalMessages ?? []).some((message: any) => hasSkip(message?.buttons))
  );
}

/**
 * Генерация Python универсальных обработчиков с валидацией параметров
 * @param params - Параметры обработчиков
 * @returns Сгенерированный Python код обработчиков
 *
 * @example
 * ```typescript
 * const code = generateUniversalHandlers({
 *   userDatabaseEnabled: true,
 * });
 * ```
 */
export function generateUniversalHandlers(params: UniversalHandlersTemplateParams): string {
  const validated = universalHandlersParamsSchema.parse({
    ...params,
    userDatabaseEnabled: params.userDatabaseEnabled ?? false,
  });
  const nodes = params.nodes ?? [];
  return renderPartialTemplate('universal-handlers/universal-handlers.py.jinja2', {
    ...validated,
    nodes,
    commandNodes: params.commandNodes ?? [],
    hasUrlButtons: params.hasUrlButtons ?? false,
    hasSkipDataCollectionButtons:
      validated.hasSkipDataCollectionButtons ?? hasSkipDataCollectionButtons(nodes),
    allNodeIds: params.allNodeIds ?? [],
  });
}
