// Функция для правильного форматирования текста с поддержкой многострочности

export function formatTextForPython(text: string): string {
  if (!text) return '""';

  // Для многострочного текста используем тройные кавычки
  if (text.includes('\n')) {
    return `"""${text}"""`;
  } else {
    // Для однострочного текста экранируем только кавычки
    return `"${text.replace(/"/g, '\\"')}"`;
  }
}
