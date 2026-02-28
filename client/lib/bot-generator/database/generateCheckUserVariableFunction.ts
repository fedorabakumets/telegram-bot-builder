/**
 * @fileoverview Утилита для генерации кода функции проверки пользовательских переменных
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию проверки пользовательских переменных для использования
 * внутри других функций.
 *
 * @module generateCheckUserVariableFunction
 */

import { processCodeWithAutoComments } from "../utils/generateGeneratedComment";

/**
 * Генерирует код определения функции check_user_variable_inline для использования внутри других функций.
 * @param indentLevel - уровень отступа для генерируемого кода.
 * @returns строка с Python кодом функции.
 */

export function generateCheckUserVariableFunction(indentLevel: string): string {
    const checkUserInlineCodeLines: string[] = [];

    // Используем глобально определенную функцию check_user_variable_inline
    checkUserInlineCodeLines.push('# ┌─────────────────────────────────────────┐');
    checkUserInlineCodeLines.push('# │  Использование глобальной функции       │');
    checkUserInlineCodeLines.push('# │      проверки пользовательских          │');
    checkUserInlineCodeLines.push('# │             переменных                  │');
    checkUserInlineCodeLines.push('# └─────────────────────────────────────────┘');
    
    checkUserInlineCodeLines.push(`${indentLevel}# Используем глобально определенную функцию check_user_variable_inline`);

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(checkUserInlineCodeLines, 'generateCheckUserVariableFunction.ts');

    // Возвращаем обработанные строки
    return commentedCodeLines.join('\n');
}
