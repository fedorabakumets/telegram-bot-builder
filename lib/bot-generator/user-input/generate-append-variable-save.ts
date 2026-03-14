/**
 * @fileoverview Генерация кода для сохранения переменной в массив (append mode)
 * Если appendVariable=true, сохраняет в массив вместо перезаписи
 * @module generate-append-variable-save
 */

import { Node } from '@shared/schema';

/**
 * Генерирует Python код для сохранения переменной в массив
 * @param _node - Узел с настройками
 * @param variableName - Имя переменной
 * @param indent - Отступ для кода
 * @returns Сгенерированный код
 */
export function generateAppendVariableSaveCode(
  _node: Node,
  variableName: string,
  indent: string = '        '
): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# Режим 'Не перезаписывать': сохраняем в массив`);
  codeLines.push(`${indent}if user_id not in user_data:`);
  codeLines.push(`${indent}    user_data[user_id] = {}`);
  codeLines.push(`${indent}    `);
  codeLines.push(`${indent}# Проверяем, существует ли уже переменная`);
  codeLines.push(`${indent}if "${variableName}" not in user_data[user_id]:`);
  codeLines.push(`${indent}    # Первое значение — создаём список`);
  codeLines.push(`${indent}    user_data[user_id]["${variableName}"] = [response_data]`);
  codeLines.push(`${indent}    logging.info(f"✅ Создан список ${variableName} с первым значением: {{response_data}}")`);
  codeLines.push(`${indent}else:`);
  codeLines.push(`${indent}    # Переменная существует — проверяем тип`);
  codeLines.push(`${indent}    existing_value = user_data[user_id]["${variableName}"]`);
  codeLines.push(`${indent}    if isinstance(existing_value, list):`);
  codeLines.push(`${indent}        # Уже список — добавляем новое значение`);
  codeLines.push(`${indent}        user_data[user_id]["${variableName}"].append(response_data)`);
  codeLines.push(`${indent}        logging.info(f"✅ Добавлено в список ${variableName}: {{response_data}} (всего: {{len(user_data[user_id][\\"${variableName}\\"])}}")`);
  codeLines.push(`${indent}    else:`);
  codeLines.push(`${indent}        # Было одиночное значение — преобразуем в список`);
  codeLines.push(`${indent}        user_data[user_id]["${variableName}"] = [existing_value, response_data]`);
  codeLines.push(`${indent}        logging.info(f"✅ Преобразовано в список ${variableName}: [{{existing_value}}, {{response_data}}]")`);

  return codeLines.join('\n');
}
