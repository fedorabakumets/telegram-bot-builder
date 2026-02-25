/**
 * @fileoverview Генерация кода для автоперехода в рассылке через Client API
 *
 * Этот модуль генерирует Python-код для выполнения автоперехода
 * к следующему узлу после отправки сообщения рассылки через
 * Telegram Client API (Telethon).
 *
 * @module generateBroadcastClientAutoTransition
 */

/**
 * Генерирует код для выполнения автоперехода к следующему узлу
 *
 * @param {string} indent - Отступ для кода
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastClientAutoTransition(indent: string = '            '): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# Проверка автоперехода к следующему узлу`);
  codeLines.push(`${indent}auto_transition_to = node_data.get("autoTransitionTo", "")`);
  codeLines.push(`${indent}if auto_transition_to:`);
  codeLines.push(`${indent}    logging.info(f"⚡ Автопереход от узла {node_data['id']} к узлу {auto_transition_to}")`);
  codeLines.push(`${indent}    # Ищем следующий узел в списке broadcast_nodes`);
  codeLines.push(`${indent}    next_index = next((i for i, n in enumerate(broadcast_nodes) if n["id"] == auto_transition_to), -1)`);
  codeLines.push(`${indent}    if next_index != -1:`);
  codeLines.push(`${indent}        current_node_index = next_index`);
  codeLines.push(`${indent}        logging.info(f"✅ Автопереход выполнен: {node_data['id']} -> {auto_transition_to}")`);
  codeLines.push(`${indent}    else:`);
  codeLines.push(`${indent}        logging.warning(f"⚠️ Узел для автоперехода не найден: {auto_transition_to}")`);
  codeLines.push(`${indent}        current_node_index += 1`);
  codeLines.push(`${indent}else:`);
  codeLines.push(`${indent}    current_node_index += 1`);

  return codeLines.join('\n');
}
