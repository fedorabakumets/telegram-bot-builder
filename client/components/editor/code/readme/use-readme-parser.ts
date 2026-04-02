/**
 * @fileoverview Утилиты для парсинга Markdown контента README
 * Содержит функции извлечения статистики и команд BotFather
 */

/**
 * Парсит статистику из Markdown контента
 * Ищет секцию "### Статистика" и извлекает значения
 * @param content - Markdown контент для парсинга
 * @returns Массив объектов статистики или null если секция не найдена
 */
export function parseStats(content: string): Array<{ label: string; value: number }> | null {
  const statsMatch = content.match(/### Статистика\s*\n([\s\S]*?)(?=\n##|\n#|$)/);
  if (!statsMatch) return null;

  const statsBlock = statsMatch[1];
  const stats: Array<{ label: string; value: number }> = [];

  for (const line of statsBlock.split('\n')) {
    const match = line.match(/-\s*\*\*([^*]+)\*\*:\s*(\d+)/);
    if (match) {
      stats.push({ label: match[1].trim(), value: parseInt(match[2], 10) });
    }
  }

  return stats.length > 0 ? stats : null;
}

/**
 * Извлекает команды BotFather из Markdown контента
 * Ищет блок между маркерами BOTFATHER_COMMANDS_START и BOTFATHER_COMMANDS_END
 * @param content - Markdown контент для парсинга
 * @returns Строка с командами или null если блок не найден
 */
export function extractBotFatherCommands(content: string): string | null {
  const startMarker = '<!-- BOTFATHER_COMMANDS_START -->';
  const endMarker = '<!-- BOTFATHER_COMMANDS_END -->';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) return null;

  const block = content.substring(startIndex + startMarker.length, endIndex);
  const codeMatch = block.match(/```([\s\S]*?)```/);

  return codeMatch ? codeMatch[1].trim() : null;
}
