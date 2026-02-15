/**
 * @fileoverview Утилита для генерации кода алиасов функций для callback обработчиков
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего алиасы функций для callback обработчиков.
 *
 * @module AliasNodes
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Добавляет в код алиасы функций для callback обработчиков
 * @param {string[]} codeLines - Массив строк кода, в который будет добавлены алиасы
 * @param {any[]} nodes - Массив узлов для генерации алиасов
 */
export function AliasNodes(codeLines: string[], nodes: any[]) {
    const aliasCodeLines: string[] = [];

    // Алиасы для обработчиков команд
    codeLines.push('# ┌─────────────────────────────────────────┐');
    codeLines.push('# │      Алиасы для обработчиков команд     │');
    codeLines.push('# └─────────────────────────────────────────┘');

    // Проверяем, есть ли узел типа 'start', чтобы избежать создания алиаса для несуществующего обработчика
    const hasStartNode = nodes.some(node => node.type === 'start');
    if (hasStartNode) {
        aliasCodeLines.push('async def handle_command_start(message):');
        aliasCodeLines.push('    """Алиас для start_handler, используется в callback обработчиках"""');
        aliasCodeLines.push('    await start_handler(message)');
        aliasCodeLines.push('');
    }
    
    const commandAliasNodes = (nodes || []).filter(node => node.type === 'command' && node.data.command);
    commandAliasNodes.forEach(node => {
        const command = node.data.command.replace('/', '');
        const functionName = command.replace(/[^a-zA-Z0-9_]/g, '_');
        aliasCodeLines.push(`async def handle_command_${functionName}(message):`);
        aliasCodeLines.push(`    """Алиас для ${functionName}_handler, используется в callback обработчиках"""`);
        aliasCodeLines.push(`    await ${functionName}_handler(message)`);
        aliasCodeLines.push('');
    });

    // Применяем автоматическое добавление комментариев ко всему коду
    const commentedCodeLines = processCodeWithAutoComments(aliasCodeLines, 'AliasNodes.ts');

    // Добавляем обработанные строки в исходный массив
    codeLines.push(...commentedCodeLines);
}
