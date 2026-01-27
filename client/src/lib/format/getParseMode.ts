// Функция для получения режима парсинга


export function getParseMode(formatMode: string): string {
  if (formatMode === 'html') {
    return ', parse_mode=ParseMode.HTML';
  } else if (formatMode === 'markdown') {
    return ', parse_mode=ParseMode.MARKDOWN';
  }
  return '';
}
