/**
 * Экранирует строковое значение для безопасного использования в Python-коде
 * @param {string} value - Значение для экранирования
 * @returns {string} Экранированное значение
 */
export function escapePythonString(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return 'None';
    }

    if (typeof value === 'number') {
        return value.toString();
    }

    // Экранируем кавычки и обратные слэши для использования в Python строках
    const escaped = value
        .toString()
        .replace(/\\/g, '\\\\') // Экранируем обратные слэши
        .replace(/'/g, "\\'") // Экранируем одинарные кавычки
        .replace(/"/g, '\\"'); // Экранируем двойные кавычки

    return `'${escaped}'`;
}
