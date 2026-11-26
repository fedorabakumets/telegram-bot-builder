/** @fileoverview Подсказки для исправления синтаксиса в редакторе JSON. */

/**
 * Объясняет ошибку разбора и указывает место, если браузер его сообщил.
 * @param source - Текст черновика
 * @param error - Ошибка разбора
 * @returns Подсказка для пользователя
 */
export function describeJsonError(source: string, error: unknown): string {
  if (!source.trim()) return 'Введите настройки блока в фигурных скобках {}.';
  const message = error instanceof Error ? error.message : '';
  const offset = /position (\d+)/i.exec(message);
  const line = /line (\d+)/i.exec(message)?.[1];
  const index = offset ? Number(offset[1]) : undefined;
  const row = line ?? (index === undefined ? undefined : source.slice(0, index).split(/\r\n|\r|\n/).length);
  const where = row ? `Строка ${row}. ` : '';
  if (/expected ',' or '}'/i.test(message)) {
    const field = index === undefined ? undefined : /^"([^"\\\r\n]{1,60})"\s*:/.exec(source.slice(index))?.[1];
    return where + (field ? `Поставьте запятую перед полем «${field}».` : 'Разделите поля запятой или закройте объект скобкой }.');
  }
  if (/expected ':'/i.test(message)) return where + 'Поставьте двоеточие после имени поля.';
  if (/unterminated string/i.test(message)) return where + 'Закройте текст двойной кавычкой.';
  if (/expected property name|double-quoted property name/i.test(message)) {
    return where + 'Проверьте двойные кавычки у названий полей и уберите запятую после последнего поля, если она есть.';
  }
  return where + 'Проверьте запятые между значениями, двойные кавычки и закрывающие скобки.';
}