import { escapeForPython } from './escapeForPython';

// Функция для правильного форматирования текста с поддержкой многострочности и UTF-8
export function formatTextForPython(text: string): string {
  if (!text) return '""';

  // Для многострочного текста используем тройные кавычки с правильным экранированием
  if (text.includes('\n')) {
    // В тройных кавычках нужно экранировать только тройные кавычки
    const escapedText = text.replace(/"""/g, '\\"\\"\\"');
    return `"""${escapedText}"""`;
  } else {
    // Для однострочного текста используем полное экранирование
    return `"${escapeForPython(text)}"`;
  }
}
