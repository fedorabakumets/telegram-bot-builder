/**
 * @fileoverview Утилита для генерации кода глобальной функции проверки пользовательских переменных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего глобальную функцию проверки пользовательских переменных.
 *
 * @module generateGlobalCheckUserVariableFunction
 */

import { processCodeWithAutoComments } from "../utils/generateGeneratedComment";

/**
 * Генерирует код определения глобальной функции check_user_variable_inline.
 * @param indentLevel - уровень отступа для генерируемого кода.
 * @returns строка с Python кодом функции.
 */

export function generateGlobalCheckUserVariableFunction(indentLevel: string = ''): string {
    const checkUserCodeLines: string[] = [];

    // Функция проверки пользовательских переменных (глобально)
    checkUserCodeLines.push('# ┌─────────────────────────────────────────┐');
    checkUserCodeLines.push('# │  Функция проверки пользовательских       │');
    checkUserCodeLines.push('# │           переменных (глобально)         │');
    checkUserCodeLines.push('# └─────────────────────────────────────────┘');

    checkUserCodeLines.push(`${indentLevel}def check_user_variable_inline(var_name, user_data_dict):`);
    checkUserCodeLines.push(`${indentLevel}    if "user_data" in user_data_dict and user_data_dict["user_data"]:`);
    checkUserCodeLines.push(`${indentLevel}        try:`);
    checkUserCodeLines.push(`${indentLevel}            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]`);
    checkUserCodeLines.push(`${indentLevel}            if var_name in parsed_data:`);
    checkUserCodeLines.push(`${indentLevel}                raw_value = parsed_data[var_name]`);
    checkUserCodeLines.push(`${indentLevel}                if isinstance(raw_value, dict) and "value" in raw_value:`);
    checkUserCodeLines.push(`${indentLevel}                    var_value = raw_value["value"]`);
    checkUserCodeLines.push(`${indentLevel}                    if var_value is not None and str(var_value).strip() != "":`);
    checkUserCodeLines.push(`${indentLevel}                        return True, str(var_value)`);
    checkUserCodeLines.push(`${indentLevel}                else:`);
    checkUserCodeLines.push(`${indentLevel}                    if raw_value is not None and str(raw_value).strip() != "":`);
    checkUserCodeLines.push(`${indentLevel}                        return True, str(raw_value)`);
    checkUserCodeLines.push(`${indentLevel}        except (json.JSONDecodeError, TypeError):`);
    checkUserCodeLines.push(`${indentLevel}            pass`);
    checkUserCodeLines.push(`${indentLevel}    if var_name in user_data_dict:`);
    checkUserCodeLines.push(`${indentLevel}        variable_data = user_data_dict.get(var_name)`);
    checkUserCodeLines.push(`${indentLevel}        if isinstance(variable_data, dict) and "value" in variable_data:`);
    checkUserCodeLines.push(`${indentLevel}            var_value = variable_data["value"]`);
    checkUserCodeLines.push(`${indentLevel}            if var_value is not None and str(var_value).strip() != "":`);
    checkUserCodeLines.push(`${indentLevel}                return True, str(var_value)`);
    checkUserCodeLines.push(`${indentLevel}        elif variable_data is not None and str(variable_data).strip() != "":`);
    checkUserCodeLines.push(`${indentLevel}            return True, str(variable_data)`);
    checkUserCodeLines.push(`${indentLevel}    return False, None`);

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(checkUserCodeLines, 'generateGlobalCheckUserVariableFunction.ts');

    // Возвращаем обработанные строки
    return commentedCodeLines.join('\n');
}
