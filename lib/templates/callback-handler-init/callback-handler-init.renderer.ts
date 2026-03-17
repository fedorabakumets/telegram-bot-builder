/**
 * @fileoverview Renderer для шаблона callback-handler-init
 * @module templates/callback-handler-init/callback-handler-init.renderer
 */

import type { CallbackHandlerInitTemplateParams } from './callback-handler-init.params';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код инициализации callback-обработчика.
 * Заменяет generateCallbackHandlerInit() из bot-generator/transitions/callback-handler-init.ts
 */
export function generateCallbackHandlerInit(params: CallbackHandlerInitTemplateParams): string {
  return renderPartialTemplate('callback-handler-init/callback-handler-init.py.jinja2', params);
}

/**
 * Строит параметры из данных целевого узла
 */
export function buildCallbackHandlerInitParams(
  nodeId: string,
  targetNode: any,
  indent: string = '    '
): CallbackHandlerInitTemplateParams {
  const buttons = targetNode.data?.buttons || [];
  const hasHideAfterClick = buttons.some((btn: any) => btn.hideAfterClick === true);
  const variableFilters = targetNode.data?.variableFilters &&
    Object.keys(targetNode.data.variableFilters).length > 0
    ? targetNode.data.variableFilters
    : null;

  return {
    nodeId,
    hasHideAfterClick,
    variableFilters,
    indentLevel: indent,
  };
}
