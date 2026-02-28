/**
 * @fileoverview Обработка множественного выбора
 *
 * Модуль генерирует Python-код для обработки кнопок "Готово" при множественном выборе
 * и перехода к следующему узлу после завершения выбора.
 *
 * @module bot-generator/transitions/multi-select-handler
 */

/**
 * Параметры для генерации обработки множественного выбора
 */
export interface MultiSelectHandlerParams {
  /** ID узла */
  nodeId: string;
  /** Переменная для сохранения выбора */
  multiSelectVariable: string;
  /** Цель для кнопки продолжения */
  continueButtonTarget?: string;
  /** Массив всех узлов для проверки существования */
  nodes: any[];
}

/**
 * Генерирует код обработки множественного выбора
 *
 * @param params - Параметры множественного выбора
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код или пустая строка
 */
export function generateMultiSelectHandler(
  params: MultiSelectHandlerParams,
  indent: string = '    '
): string {
  const { nodeId: _nodeId, multiSelectVariable: _multiSelectVariable, continueButtonTarget, nodes } = params;

  // Проверяем, есть ли кнопка продолжения
  if (!continueButtonTarget) {
    return '';
  }

  let code = '';

  // Переход к следующему узлу
  code += `${indent}# Переход к следующему узлу\n`;
  code += `${indent}next_node_id = "${continueButtonTarget}"\n`;
  code += `${indent}try:\n`;

  // Проверяем существование целевого узла
  const targetExists = nodes.some(n => n.id === continueButtonTarget);
  const safeFunctionName = continueButtonTarget.replace(/[^a-zA-Z0-9_]/g, '_');

  if (targetExists) {
    code += `${indent}    await handle_callback_${safeFunctionName}(callback_query)\n`;
  } else {
    code += `${indent}    logging.warning(f"⚠️ Целевой узел не найден: {next_node_id}, завершаем переход")\n`;
    code += `${indent}    await callback_query.message.edit_text("Переход завершен")\n`;
  }

  // Обработка ошибок
  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n`;
  code += `${indent}    await callback_query.message.edit_text("Переход завершен")\n`;

  return code;
}

/**
 * Генерирует код завершения множественного выбора без перехода
 *
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateMultiSelectComplete(indent: string = '    '): string {
  let code = '';
  code += `${indent}# Завершение множественного выбора\n`;
  code += `${indent}await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)\n`;
  return code;
}
