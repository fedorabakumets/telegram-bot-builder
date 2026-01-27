// Функция для удаления HTML тегов из текста

export function stripHtmlTags(text: string): string {
  if (!text) return text;
  return text.replace(/<[^>]*>/g, '');
}
