// client/src/lib/variable/findMediaVariablesInText.ts
// Функция для поиска переменных медиа в тексте

export function findMediaVariablesInText(text: string): string[] {
  // Регулярное выражение для поиска переменных в тексте
  // Переменные могут быть в формате {{variableName}} или {variableName}
  const regex = /\{\{([^}]+)\}\}|\{([^}]+)\}/g;
  const matches = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Берем первую найденную группу (внутри фигурных скобок)
    const variable = match[1] || match[2];
    if (variable) {
      matches.push(variable.trim());
    }
  }

  return matches;
}