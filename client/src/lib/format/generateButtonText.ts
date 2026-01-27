import { escapeForPython } from "./escapeForPython";

// Функция для генерации текста кнопки с поддержкой переменных


export function generateButtonText(buttonText: string): string {
  // Проверяем, есть ли в тексте переменные (паттерн {переменная})
  if (buttonText.includes('{') && buttonText.includes('}')) {
    // Экранируем текст для Python и оборачиваем в replace_variables_in_text
    const escapedText = escapeForPython(buttonText);
    return `replace_variables_in_text("${escapedText}", user_vars)`;
  } else {
    // Обычный текст без переменных
    return `"${escapeForPython(buttonText)}"`;
  }
}
