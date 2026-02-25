/**
 * @fileoverview Утилиты для терминала
 *
 * Содержит функции для работы с выводом терминала:
 * - Копирование в буфер обмена
 * - Сохранение в файл
 *
 * @module terminalUtils
 */

/**
 * Копирование вывода терминала в буфер обмена
 * @param lines - Массив строк вывода
 */
export function copyTerminalOutput(lines: { content: string }[]): void {
  const outputText = lines.map(line => line.content).join('\n');
  navigator.clipboard.writeText(outputText);
}

/**
 * Сохранение вывода терминала в файл
 * @param lines - Массив строк вывода
 */
export function saveTerminalOutput(lines: { content: string }[]): void {
  const outputText = lines.map(line => line.content).join('\n');
  const blob = new Blob([outputText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terminal-output-${new Date().toISOString().slice(0, 19)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
