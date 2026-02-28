/**
 * @fileoverview Генерация цикла автопереходов между узлами
 * 
 * Модуль создаёт Python-код для поддержки последовательных
 * переходов между узлами без участия пользователя.
 * 
 * @module bot-generator/user-input/generate-auto-navigation-loop
 */

/**
 * Генерирует Python-код для цикла автопереходов
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код цикла автопереходов
 */
export function generateAutoNavigationLoop(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Цикл для поддержки автопереходов\n`;
  code += `${indent}while next_node_id:\n`;
  code += `${indent}    logging.info(f"🚀 Переходим к узлу: {next_node_id}")\n`;
  code += `${indent}    current_node_id = next_node_id\n`;
  code += `${indent}    next_node_id = None  # Сбрасываем, будет установлен при автопереходе\n`;
  code += `${indent}    # Проверяем навигацию к узлам\n`;
  return code;
}
