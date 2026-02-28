/**
 * @fileoverview Генерация обработки кнопки "Готово" для множественного выбора
 * 
 * Модуль создаёт Python-код для обработки нажатия кнопки "Готово"
 * при множественном выборе, включая сохранение и очистку состояния.
 * 
 * @module bot-generator/transitions/multi-select/generate-multi-select-done-button
 */

/**
 * Параметры для генерации обработки кнопки "Готово"
 */
export interface MultiSelectDoneParams {
  nodeId: string;
  multiSelectVariable: string;
  continueButtonTarget?: string;
}

/**
 * Генерирует Python-код для обработки кнопки "Готово"
 * 
 * @param params - Параметры множественного выбора
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMultiSelectDoneButton(
  params: MultiSelectDoneParams,
  indent: string = '    '
): string {
  const { nodeId, multiSelectVariable, continueButtonTarget } = params;
  
  let code = '';
  code += `${indent}# Проверяем, является ли это кнопкой "Готово"\n`;
  code += `${indent}if callback_data == "done_${String(nodeId).slice(-10).replace(/^_+/, '')}":\n`;
  code += `${indent}    logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")\n`;
  code += `${indent}    \n`;
  code += `${indent}    # Сохраняем выбранные значения в базу данных\n`;
  code += `${indent}    selected_options = user_data.get(user_id, {}).get("multi_select_${nodeId}", [])\n`;
  code += `${indent}    if selected_options:\n`;
  code += `${indent}        selected_text = ", ".join(selected_options)\n`;
  code += `${indent}        \n`;
  code += `${indent}        # Универсальная логика аккумуляции для всех множественных выборов\n`;
  code += `${indent}        existing_data = await get_user_data_from_db(user_id, "${multiSelectVariable}")\n`;
  code += `${indent}        existing_selections = []\n`;
  code += `${indent}        if existing_data and existing_data.strip():\n`;
  code += `${indent}            existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]\n`;
  code += `${indent}        \n`;
  code += `${indent}        all_selections = list(set(existing_selections + selected_options))\n`;
  code += `${indent}        final_text = ", ".join(all_selections)\n`;
  code += `${indent}        await update_user_data_in_db(user_id, "${multiSelectVariable}", final_text)\n`;
  code += `${indent}        logging.info(f"✅ Аккумулировано в переменную ${multiSelectVariable}: {final_text}")\n`;
  code += `${indent}    \n`;
  code += `${indent}    # Очищаем состояние множественного выбора\n`;
  code += `${indent}    if user_id in user_data:\n`;
  code += `${indent}        user_data[user_id].pop("multi_select_${nodeId}", None)\n`;
  code += `${indent}        user_data[user_id].pop("multi_select_node", None)\n`;
  code += `${indent}        user_data[user_id].pop("multi_select_type", None)\n`;
  code += `${indent}        user_data[user_id].pop("multi_select_variable", None)\n`;
  
  return code;
}
