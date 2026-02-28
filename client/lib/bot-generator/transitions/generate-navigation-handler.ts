/**
 * @fileoverview Генерация обработки навигации к узлу
 *
 * Модуль создаёт Python-код для обработки навигации к узлам
 * с множественным выбором и условными сообщениями в callback.
 *
 * @module bot-generator/transitions/generate-navigation-handler
 */

import { formatTextForPython } from '../format';
import { toPythonBoolean } from '../format';

interface NavigationHandlerParams {
  /** Целевой узел навигации */
  navTargetNode: any;
  /** Отступ для кода */
  indent: string;
}

interface NavigationHandlerResult {
  /** Сгенерированный код */
  code: string;
  /** Требуется ли полноценный обработчик */
  needsFullHandler: boolean;
  /** Тип обработчика: 'multiSelect', 'conditional', 'standard' */
  handlerType: string;
}

/**
 * Генерирует код обработки навигации к узлу
 *
 * @param params - Параметры навигации
 * @returns Результат генерации
 */
export function generateNavigationHandler(
  params: NavigationHandlerParams
): NavigationHandlerResult {
  const { navTargetNode, indent } = params;
  let code = '';
  let needsFullHandler = false;
  let handlerType = 'standard';

  // Проверка множественного выбора
  if (navTargetNode.data.allowMultipleSelection === true) {
    const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `${indent}# Узел с множественным выбором - вызываем полноценный обработчик\n`;
    code += `${indent}logging.info(f"🔧 Callback навигация к узлу с множественным выбором: ${navTargetNode.id}")\n`;
    code += `${indent}await handle_callback_${safeFunctionName}(callback_query)\n`;
    needsFullHandler = true;
    handlerType = 'multiSelect';
    return { code, needsFullHandler, handlerType };
  }

  // Проверка условных сообщений
  const hasConditionalMessages = navTargetNode.data.enableConditionalMessages &&
    navTargetNode.data.conditionalMessages &&
    navTargetNode.data.conditionalMessages.length > 0;

  if (hasConditionalMessages && navTargetNode.data.collectUserInput === true) {
    const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `${indent}# Узел с условными сообщениями - вызываем полноценный обработчик\n`;
    code += `${indent}logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: ${navTargetNode.id}")\n`;
    code += `${indent}await handle_node_${safeFunctionName}(callback_query.message)\n`;
    needsFullHandler = true;
    handlerType = 'conditional';
    return { code, needsFullHandler, handlerType };
  }

  // Стандартная обработка
  handlerType = 'standard';
  const messageText = navTargetNode.data.messageText || 'Сообщение';
  const formattedText = formatTextForPython(messageText);
  code += `${indent}nav_text = ${formattedText}\n`;

  return { code, needsFullHandler, handlerType };
}

/**
 * Генерирует код замены переменных в тексте
 *
 * @param textVarName - Имя переменной с текстом
 * @param userVarsName - Имя переменной с данными пользователя
 * @param indent - Отступ
 * @returns Сгенерированный Python-код
 */
export function generateVariableReplacementInText(
  textVarName: string,
  userVarsName: string,
  indent: string
): string {
  let code = '';
  code += `${indent}# Заменяем переменные в ${textVarName}\n`;
  code += `${indent}for var_name, var_data in ${userVarsName}.items():\n`;
  code += `${indent}    placeholder = "{" + var_name + "}"\n`;
  code += `${indent}    if placeholder in ${textVarName}:\n`;
  code += `${indent}        if isinstance(var_data, dict) and "value" in var_data:\n`;
  code += `${indent}            var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n`;
  code += `${indent}        elif var_data is not None:\n`;
  code += `${indent}            var_value = str(var_data)\n`;
  code += `${indent}        else:\n`;
  code += `${indent}            var_value = var_name\n`;
  code += `${indent}        ${textVarName} = ${textVarName}.replace(placeholder, var_value)\n`;
  return code;
}

/**
 * Генерирует код проверки автоперехода
 *
 * @param navTargetNode - Целевой узел
 * @param indent - Отступ
 * @returns Сгенерированный Python-код
 */
export function generateAutoTransitionCheck(
  navTargetNode: any,
  indent: string
): string {
  if (!navTargetNode.data.enableAutoTransition || !navTargetNode.data.autoTransitionTo) {
    return '';
  }

  const autoTargetId = navTargetNode.data.autoTransitionTo;
  const navCollectUserInputValue = navTargetNode.data.collectUserInput === true;

  let code = '';
  code += `${indent}\n`;
  code += `${indent}# Проверяем, не ждем ли мы ввод перед автопереходом\n`;
  code += `${indent}if user_id in user_data and ("waiting_for_input" in user_data[user_id] || "waiting_for_conditional_input" in user_data[user_id]):\n`;
  code += `${indent}    logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла ${navTargetNode.id}")\n`;
  code += `${indent}# Проверяем, разрешён ли автопереход для этого узла (collectUserInput)\n`;
  code += `${indent}elif user_id in user_data and user_data[user_id].get("collectUserInput_${navTargetNode.id}", ${toPythonBoolean(navCollectUserInputValue)}) == True:\n`;
  code += `${indent}    logging.info(f"ℹ️ Узел ${navTargetNode.id} ожидает ввод (collectUserInput=true), автопереход пропущен")\n`;
  code += `${indent}else:\n`;
  code += `${indent}    # ⚡ Автопереход к узлу ${autoTargetId}\n`;
  code += `${indent}    logging.info(f"⚡ Автопереход от узла ${navTargetNode.id} к узлу ${autoTargetId}")\n`;

  return code;
}

/**
 * Генерирует код вызова обработчика автоперехода
 *
 * @param autoTargetId - ID целевого узла
 * @param currentNodeId - ID текущего узла
 * @param indent - Отступ
 * @returns Сгенерированный Python-код
 */
export function generateAutoTransitionCall(
  autoTargetId: string,
  currentNodeId: string,
  indent: string
): string {
  const safeAutoTargetId = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');

  let code = '';
  // ИСПРАВЛЕНИЕ: Проверяем, что это не fake callback (для предотвращения дублирования)
  code += `${indent}# Проверяем, что это не fake callback (для предотвращения дублирования сообщений)\n`;
  code += `${indent}if not is_fake_callback:\n`;
  code += `${indent}    await handle_callback_${safeAutoTargetId}(callback_query)\n`;
  code += `${indent}    logging.info(f"✅ Автопереход выполнен: ${currentNodeId} -> ${autoTargetId}")\n`;
  code += `${indent}    return\n`;

  return code;
}
