/**
 * @fileoverview Renderer для шаблона callback-handler-init
 * @module templates/callback-handler-init/callback-handler-init.renderer
 */

import type { CallbackHandlerInitTemplateParams } from './callback-handler-init.params';
import { callbackHandlerInitParamsSchema } from './callback-handler-init.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код инициализации callback-обработчика.
 * @param params - Параметры инициализации
 * @returns Сгенерированный Python код
 */
export function generateCallbackHandlerInit(params: CallbackHandlerInitTemplateParams): string {
  const validated = callbackHandlerInitParamsSchema.parse(params);
  return renderPartialTemplate('callback-handler-init/callback-handler-init.py.jinja2', validated);
}

/**
 * Генерирует базовую структуру callback обработчика
 */
export function generateBaseCallbackHandlerStructure(code: string, safeFunctionName: any): string {
  code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
  code += '    # Безопасное получение данных из callback_query\n';
  code += '    callback_data = None  # Инициализируем переменную\n';
  code += '    try:\n';
  code += '        user_id = callback_query.from_user.id\n';
  code += '        callback_data = callback_query.data\n';
  code += `        logging.info(f"🔵 Вызван callback handler: handle_callback_${safeFunctionName} для пользователя {user_id}")\n`;
  code += '    except Exception as e:\n';
  code += `        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_${safeFunctionName}: {e}")\n`;
  code += '        return\n';
  code += '    \n';
  code += '    try:\n';
  code += '        await callback_query.answer()\n';
  code += '    except Exception:\n';
  code += '        pass\n';
  code += '    \n';
  code += '    user_name = await init_user_variables(user_id, callback_query.from_user)\n';
  code += '    \n';
  return code;
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
