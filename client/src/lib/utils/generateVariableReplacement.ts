// client/src/lib/utils/generateVariableReplacement.ts
// Функция для генерации замены переменных

export function generateVariableReplacement(value: any): string {
  // Генерирует строку замены для переменной
  return String(value);
}

export function generateUniversalVariableReplacement(
  text: string, 
  variables: Record<string, any>
): string {
  // Заменяет все переменные в тексте на их значения
  return text.replace(/\{\{([^}]+)\}\}|\{([^}]+)\}/g, (match, p1, p2) => {
    const variableName = p1 || p2;
    if (variables.hasOwnProperty(variableName)) {
      return String(variables[variableName]);
    }
    // Если переменная не найдена, возвращаем оригинальное совпадение
    return match;
  });
}