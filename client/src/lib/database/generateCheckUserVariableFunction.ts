import { processCodeWithAutoComments } from "../utils/generateGeneratedComment";

/**
 * Генерирует код определения функции check_user_variable_inline для использования внутри других функций.
 * @param indentLevel - уровень отступа для генерируемого кода.
 * @returns строка с Python кодом функции.
 */

export function generateCheckUserVariableFunction(indentLevel: string): string {
    const checkUserInlineCodeLines: string[] = [];

    // Используем глобально определенную функцию check_user_variable_inline
    checkUserInlineCodeLines.push(`${indentLevel}# Используем глобально определенную функцию check_user_variable_inline`);

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(checkUserInlineCodeLines, 'generateUniversalVariableReplacement.ts');

    // Возвращаем обработанные строки
    return commentedCodeLines.join('\n');
}
