/**
 * @fileoverview Генерация fallback навигации
 * 
 * Модуль создаёт Python-код для обработки fallback сценариев
 * при навигации к узлам с множественным выбором или без условных сообщений.
 * 
 * @module bot-generator/transitions/navigation/generate-navigation-fallback
 */

import { formatTextForPython, toPythonBoolean } from '../../format';
import { generateKeyboard } from '../../../templates/keyboard';

/**
 * Параметры для генерации fallback навигации
 */
export interface NavigationFallbackParams {
  navTargetNode: any;
  userVars: string;
  allNodeIds: any[];
  inputTargetNodeId?: string;
  userId: string;
}

/**
 * Генерирует Python-код для fallback навигации к узлу с множественным выбором
 * 
 * @param params - Параметры навигации
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMultiSelectFallbackNavigation(
  params: NavigationFallbackParams,
  indent: string = '            '
): string {
  const { navTargetNode, userVars, allNodeIds } = params;
  
  let code = '';
  const messageText = navTargetNode.data?.messageText || 'Сообщение';
  const formattedText = formatTextForPython(messageText);
  
  code += `${indent}# Прямая навигация к узлу с множественным выбором ${navTargetNode.id}\n`;
  code += `${indent}logging.info(f"🔧 Переходим к узлу с множественным выбором: ${navTargetNode.id}")\n`;
  code += `${indent}text = ${formattedText}\n`;
  code += `${indent}\n`;
  code += `${indent}# Замена переменных\n`;
  code += `${indent}user_data[{user_var_prefix}] = user_data.get({user_var_prefix}, {})\n`.replace(/{user_var_prefix}/g, userVars.includes('callback_query') ? 'callback_query.from_user.id' : 'user_id');
  
  code += `${indent}# Инициализируем состояние множественного выбора\n`;
  code += `${indent}user_data[{prefix}]["multi_select_${navTargetNode.id}"] = []\n`.replace(/{prefix}/g, userVars.includes('callback_query') ? 'callback_query.from_user.id' : 'user_id');
  code += `${indent}user_data[{prefix}]["multi_select_node"] = "${navTargetNode.id}"\n`.replace(/{prefix}/g, userVars.includes('callback_query') ? 'callback_query.from_user.id' : 'user_id');
  code += `${indent}user_data[{prefix}]["multi_select_type"] = "selection"\n`.replace(/{prefix}/g, userVars.includes('callback_query') ? 'callback_query.from_user.id' : 'user_id');
  
  if (navTargetNode.data?.multiSelectVariable) {
    code += `${indent}user_data[{prefix}]["multi_select_variable"] = "${navTargetNode.data.multiSelectVariable}"\n`.replace(/{prefix}/g, userVars.includes('callback_query') ? 'callback_query.from_user.id' : 'user_id');
  }
  
  // Создаем inline клавиатуру с кнопками выбора
  if (navTargetNode.data?.buttons && navTargetNode.data.buttons.length > 0) {
    code += generateInlineKeyboardCode(navTargetNode.data.buttons, indent, navTargetNode.id, navTargetNode.data, allNodeIds);
    code += `${indent}# Заменяем все переменные в тексте\n`;
    code += `${indent}# Получаем фильтры переменных для замены\n`;
    code += `${indent}variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`;
    code += `${indent}text = replace_variables_in_text(text, ${userVars}, variable_filters)\n`;
    code += `${indent}await bot.send_message({user_prefix}.id, text, reply_markup=keyboard)\n`.replace(/{user_prefix}/g, userVars.includes('callback_query') ? 'callback_query.from_user' : 'user_id');
  } else {
    code += `${indent}# Заменяем все переменные в тексте\n`;
    code += `${indent}# Получаем фильтры переменных для замены\n`;
    code += `${indent}variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`;
    code += `${indent}text = replace_variables_in_text(text, ${userVars}, variable_filters)\n`;
    code += `${indent}await bot.send_message({user_prefix}.id, text)\n`.replace(/{user_prefix}/g, userVars.includes('callback_query') ? 'callback_query.from_user' : 'user_id');
  }
  
  code += `${indent}logging.info(f"✅ Прямая навигация к узлу множественного выбора ${navTargetNode.id} выполнена")\n`;
  
  return code;
}

/**
 * Генерирует Python-код для fallback навигации к обычному узлу
 * 
 * @param params - Параметры навигации
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateRegularFallbackNavigation(
  params: NavigationFallbackParams,
  indent: string = '            '
): string {
  const { navTargetNode, userVars } = params;
  
  let code = '';
  const formattedText = formatTextForPython(navTargetNode.data?.messageText || 'Сообщение');
  
  code += `${indent}nav_text = ${formattedText}\n`;
  code += `${indent}\n`;
  
  // Проверяем, включен ли сбор пользовательского ввода
  if (navTargetNode.data?.collectUserInput === true) {
    const regularInputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
    
    code += `${indent}# Проверяем, не была ли переменная уже сохранена inline кнопкой\n`;
    const userPrefix = userVars.includes('callback_query') ? 'callback_query.from_user.id' : 'user_id';
    code += `${indent}if "${regularInputVariable}" not in user_data[${userPrefix}] or not user_data[${userPrefix}]["${regularInputVariable}"]:\n`;
    code += `${indent}    # Настраиваем ожидание ввода\n`;
    code += `${indent}    user_data[${userPrefix}]["waiting_for_input"] = {\n`;
    code += `${indent}        "type": "text",\n`;
    code += `${indent}        "variable": "${regularInputVariable}",\n`;
    code += `${indent}        "save_to_database": True,\n`;
    code += `${indent}        "node_id": "${navTargetNode.id}",\n`;
    code += `${indent}        "next_node_id": "${params.inputTargetNodeId || ''}",\n`;
    code += `${indent}        "appendVariable": ${toPythonBoolean(navTargetNode.data.appendVariable || false)}\n`;
    code += `${indent}    }\n`;
    code += `${indent}    logging.info(f"🔧 Настроено ожидание ввода для переменной: ${regularInputVariable} (узел ${navTargetNode.id})")\n`;
    code += `${indent}else:\n`;
    code += `${indent}    logging.info(f"⏭️ Переменная ${regularInputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
  } else {
    code += `${indent}logging.info(f"Переход к узлу ${navTargetNode.id} без сбора ввода")\n`;
  }
  
  code += `${indent}# Заменяем все переменные в тексте\n`;
  code += `${indent}# Получаем фильтры переменных для замены\n`;
  code += `${indent}variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`;
  code += `${indent}nav_text = replace_variables_in_text(nav_text, ${userVars}, variable_filters)\n`;
  code += `${indent}await bot.send_message(${params.userId}, nav_text)\n`;

  return code;
}
