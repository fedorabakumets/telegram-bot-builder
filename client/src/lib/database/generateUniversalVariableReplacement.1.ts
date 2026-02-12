
/**
 * @fileoverview Утилита для генерации универсальной замены переменных
 *
 * Этот модуль предоставляет функцию для генерации
 * универсальной замены переменных в тексте.
 *
 * @module generateUniversalVariableReplacement
 */

/**
 * Заменяет все переменные в тексте на их значения
 * @param {string} text - Текст с переменными для замены
 * @param {Record<string, any>} variables - Объект с переменными и их значениями
 * @returns {string} Текст с замененными переменными
 */
export function generateUniversalVariableReplacement(
    text: string,
    variables: Record<string, any>
): string {
    // Заменяет все переменные в тексте на их значения
    return text.replace(/\{\{([^}]+)\}\}|\{([^}]+)\}/g, (match, p1, p2) => {
        const variableName = p1 || p2;
        if (variables.hasOwnProperty(variableName)) {
            return String(variables[variableName]);
        }
        // Если переменная не найдена, возвращаем оригинальное совпадение
        return match;
    });
}
