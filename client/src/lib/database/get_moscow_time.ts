/**
 * @fileoverview Утилита для генерации кода функции получения московского времени
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего функцию получения текущего времени в московском часовом поясе.
 *
 * @module get_moscow_time
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код функцию для получения московского времени
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлена функция
 */
export function get_moscow_time(codeLines: string[]) {
    const moscowTimeCodeLines: string[] = [];

    // Функция для получения московского времени
    codeLines.push('# ┌─────────────────────────────────────────┐');
    codeLines.push('# │      Получение московского времени      │');
    codeLines.push('# └─────────────────────────────────────────┘');
    
    moscowTimeCodeLines.push('def get_moscow_time():');
    moscowTimeCodeLines.push('    """Возвращает текущее время в московском часовом поясе"""');
    moscowTimeCodeLines.push('    from datetime import datetime, timezone, timedelta');
    moscowTimeCodeLines.push('    moscow_tz = timezone(timedelta(hours=3))');
    moscowTimeCodeLines.push('    return datetime.now(moscow_tz).isoformat()');
    moscowTimeCodeLines.push('');
    moscowTimeCodeLines.push('');

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(moscowTimeCodeLines, 'get_moscow_time.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
