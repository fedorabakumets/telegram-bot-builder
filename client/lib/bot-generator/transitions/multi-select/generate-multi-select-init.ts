/**
 * @fileoverview Генерация инициализации состояния множественного выбора
 * 
 * Модуль создаёт Python-код для инициализации состояния
 * множественного выбора пользователя.
 * 
 * @module bot-generator/transitions/multi-select/generate-multi-select-init
 */

/**
 * Параметры для генерации инициализации multi-select
 */
export interface MultiSelectInitParams {
  nodeId: string;
  multiSelectVariable?: string;
  multiSelectKeyboardType?: string;
}

/**
 * Генерирует Python-код для инициализации состояния множественного выбора
 * 
 * @param params - Параметры инициализации
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMultiSelectInit(
  params: MultiSelectInitParams,
  indent: string = '    '
): string {
  const { nodeId, multiSelectVariable, multiSelectKeyboardType } = params;
  const variable = multiSelectVariable || 'user_selection';
  const keyboardType = multiSelectKeyboardType || 'reply';
  
  let code = '';
  code += `${indent}# Инициализация состояния множественного выбора\n`;
  code += `${indent}if user_id not in user_data:\n`;
  code += `${indent}    user_data[user_id] = {}\n`;
  code += `${indent}\n`;
  code += `${indent}# Загружаем ранее выбранные варианты\n`;
  code += `${indent}saved_selections = []\n`;
  code += `${indent}if user_vars:\n`;
  code += `${indent}    for var_name, var_data in user_vars.items():\n`;
  code += `${indent}        if var_name == "${variable}":\n`;
  code += `${indent}            if isinstance(var_data, dict) and "value" in var_data:\n`;
  code += `${indent}                selections_str = var_data["value"]\n`;
  code += `${indent}            elif isinstance(var_data, str):\n`;
  code += `${indent}                selections_str = var_data\n`;
  code += `${indent}            else:\n`;
  code += `${indent}                continue\n`;
  code += `${indent}            if selections_str and selections_str.strip():\n`;
  code += `${indent}                saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]\n`;
  code += `${indent}                break\n`;
  code += `${indent}\n`;
  code += `${indent}# Инициализируем состояние если его нет\n`;
  code += `${indent}if "multi_select_${nodeId}" not in user_data[user_id]:\n`;
  code += `${indent}    user_data[user_id]["multi_select_${nodeId}"] = saved_selections.copy()\n`;
  code += `${indent}user_data[user_id]["multi_select_node"] = "${nodeId}"\n`;
  code += `${indent}user_data[user_id]["multi_select_type"] = "${keyboardType}"\n`;
  code += `${indent}user_data[user_id]["multi_select_variable"] = "${variable}"\n`;
  code += `${indent}logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")\n`;
  code += `${indent}\n`;
  
  return code;
}
