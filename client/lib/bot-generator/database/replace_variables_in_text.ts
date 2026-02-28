/**
 * @fileoverview Утилита для генерации кода функции замены переменных в тексте
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию замены переменных в тексте.
 *
 * @module replace_variables_in_text
 */

import { processCodeWithAutoComments } from '../../utils/generateGeneratedComment';

/**
 * Генерирует код функции замены переменных в тексте
 * @param {string} indentLevel - уровень отступа для генерируемого кода
 */
export function replace_variables_in_text(codeLines: string[], indentLevel: string = '') {
  const replaceCodeLines: string[] = [];

  // Замена переменных в тексте
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │      Замена переменных в тексте         │');
  codeLines.push('# └─────────────────────────────────────────┘');

  replaceCodeLines.push(`${indentLevel}def replace_variables_in_text(text_content, variables_dict):`);
  replaceCodeLines.push(`${indentLevel}    """Заменяет переменные формата {variable_name} в тексте на их значения`);
  replaceCodeLines.push(`${indentLevel}    `);
  replaceCodeLines.push(`${indentLevel}    Args:`);
  replaceCodeLines.push(`${indentLevel}        text_content (str): Текст с переменными для замены`);
  replaceCodeLines.push(`${indentLevel}        variables_dict (dict): Словарь переменных пользователя`);
  replaceCodeLines.push(`${indentLevel}    `);
  replaceCodeLines.push(`${indentLevel}    Returns:`);
  replaceCodeLines.push(`${indentLevel}        str: Текст с замененными переменными`);
  replaceCodeLines.push(`${indentLevel}    """`);
  replaceCodeLines.push(`${indentLevel}    if not text_content or not variables_dict:`);
  replaceCodeLines.push(`${indentLevel}        logging.debug(f"🔍 replace_variables_in_text: text_content={text_content is not None}, variables_dict={variables_dict is not None}")`);
  replaceCodeLines.push(`${indentLevel}        return text_content`);
  replaceCodeLines.push(`${indentLevel}    `);
  replaceCodeLines.push(`${indentLevel}    # Логируем доступные переменные для отладки`);
  replaceCodeLines.push(`${indentLevel}    logging.debug(f"🔍 Доступные переменные для замены: {list(variables_dict.keys())}")`);
  replaceCodeLines.push(`${indentLevel}    `);
  replaceCodeLines.push(`${indentLevel}    # Проходим по всем переменным пользователя`);
  replaceCodeLines.push(`${indentLevel}    for var_name, var_data in variables_dict.items():`);
  replaceCodeLines.push(`${indentLevel}        placeholder = "{" + var_name + "}"`);
  replaceCodeLines.push(`${indentLevel}        if placeholder in text_content:`);
  replaceCodeLines.push(`${indentLevel}            # Извлекаем значение переменной`);
  replaceCodeLines.push(`${indentLevel}            if isinstance(var_data, dict) and "value" in var_data:`);
  replaceCodeLines.push(`${indentLevel}                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name`);
  replaceCodeLines.push(`${indentLevel}            elif var_data is not None:`);
  replaceCodeLines.push(`${indentLevel}                var_value = str(var_data)`);
  replaceCodeLines.push(`${indentLevel}            else:`);
  replaceCodeLines.push(`${indentLevel}                var_value = var_name  # Показываем имя переменной если значения нет`);
  replaceCodeLines.push(`${indentLevel}            `);
  replaceCodeLines.push(`${indentLevel}            # Заменяем переменную на значение`);
  replaceCodeLines.push(`${indentLevel}            text_content = text_content.replace(placeholder, var_value)`);
  replaceCodeLines.push(`${indentLevel}            logging.info(f"🔄 Заменена переменная {placeholder} на '{var_value}'")`);
  replaceCodeLines.push(`${indentLevel}    `);
  replaceCodeLines.push(`${indentLevel}    # Логируем финальный текст`);
  replaceCodeLines.push(`${indentLevel}    logging.debug(f"📝 Финальный текст после замены: {text_content[:200] if text_content else 'None'}...")`);
  replaceCodeLines.push(`${indentLevel}    return text_content`);

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(replaceCodeLines, 'replace_variables_in_text.ts');

  // Добавляем обработанные строки в исходный массив
  codeLines.push(...commentedCodeLines);
}
