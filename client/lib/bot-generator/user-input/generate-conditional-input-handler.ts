/**
 * @fileoverview Генерация обработчика условных сообщений
 * 
 * Модуль создаёт Python-код для обработки ввода пользователя
 * при ожидании условного сообщения (waiting_for_conditional_input).
 * 
 * @module bot-generator/user-input/generate-conditional-input-handler
 */

/**
 * Параметры для генерации обработчика условных сообщений
 */
export interface ConditionalInputHandlerDeps {
  skipDataCollection: (code: string) => string;
  skip_button_target: (code: string) => string;
  skipDataCollectionnavigate: (nodes: any[], code: string) => string;
  answersave: (code: string) => string;
  navigateaftersave: (code: string) => string;
  handleConditionalNavigationAndInputCollection: (nodes: any[], code: string, allNodeIds: any[]) => string;
}

/**
 * Генерирует Python-код для обработчика условных сообщений
 * 
 * @param nodes - Массив узлов для генерации навигации
 * @param allNodeIds - Массив всех ID узлов
 * @param deps - Зависимости (функции из других модулей)
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateConditionalInputHandler(
  nodes: any[],
  allNodeIds: any[],
  deps: ConditionalInputHandlerDeps,
  indent: string = '    '
): string {
  let code = '';
  
  code += `${indent}# Проверяем, ожидаем ли мы ввод для условного сообщения\n`;
  code += `${indent}if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n`;
  code += `${indent}    config = user_data[user_id]["waiting_for_conditional_input"]\n`;
  code += `${indent}    user_text = message.text\n`;
  code += `${indent}    \n`;

  // Проверка кнопок skipDataCollection
  code = deps.skipDataCollection(code);

  // Навигация при нажатии кнопки пропуска
  code = deps.skip_button_target(code);

  // Генерируем навигацию для кнопок skipDataCollection
  code = deps.skipDataCollectionnavigate(nodes, code);

  code += `${indent}        except Exception as e:\n`;
  code += `${indent}            logging.error(f"Ошибка при переходе к узлу кнопки skipDataCollection {skip_button_target}: {e}")\n`;
  code += `${indent}        return\n`;

  // Сохранение ответа пользователя
  code = deps.answersave(code);

  // Навигация после сохранения ответа
  code = deps.navigateaftersave(code);

  // Обработка условной навигации
  code = deps.handleConditionalNavigationAndInputCollection(nodes, code, allNodeIds);

  code += `${indent}        except Exception as e:\n`;
  code += `${indent}            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n`;
  code += `${indent}    \n`;
  code += `${indent}    return  # Завершаем обработку для условного сообщения\n`;
  code += `${indent}    \n`;

  return code;
}
