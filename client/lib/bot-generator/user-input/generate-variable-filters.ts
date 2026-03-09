/**
 * @fileoverview Генерация кода для обработки переменных с фильтрами
 * Обрабатывает фильтры типа |join:", " и |join:"\n"
 * @module generate-variable-filters
 */

/**
 * Генерирует Python код для обработки переменной с фильтром
 * @param variableName - Имя переменной
 * @param filter - Фильтр (например, '|join:", "')
 * @param indent - Отступ для кода
 * @returns Сгенерированный код
 */
export function generateVariableFilterCode(
  variableName: string,
  filter: string,
  indent: string = ''
): string {
  const codeLines: string[] = [];
  
  // Парсим фильтр
  const joinMatch = filter.match(/\|join:"([^"]+)"/);
  
  if (joinMatch) {
    const separator = joinMatch[1];
    const escapedSeparator = separator === '\n' ? '\\n' : separator;
    
    codeLines.push(`${indent}# Обработка фильтра ${filter}`);
    codeLines.push(`${indent}if isinstance(${variableName}, list):`);
    codeLines.push(`${indent}    ${variableName}_filtered = "${escapedSeparator}".join(str(item) for item in ${variableName})`);
    codeLines.push(`${indent}else:`);
    codeLines.push(`${indent}    ${variableName}_filtered = str(${variableName})`);
    
    return codeLines.join('\n');
  }
  
  // Если фильтр не распознан, возвращаем пустую строку
  return '';
}

/**
 * Генерирует код для подстановки переменной в текст с учётом фильтра
 * @param text - Текст с переменными
 * @param variableFilters - Объект с фильтрами переменных
 * @param indent - Отступ для кода
 * @returns Сгенерированный код
 */
export function generateTextWithFiltersCode(
  text: string,
  variableFilters: Record<string, string>,
  indent: string = '        '
): string {
  const codeLines: string[] = [];
  let processedText = text;
  
  // Находим все переменные с фильтрами в тексте
  const variableRegex = /\{([^}|]+)(\|[^}]+)?\}/g;
  let match;
  
  while ((match = variableRegex.exec(text)) !== null) {
    const fullName = match[1];
    const filter = match[2] || '';
    
    if (filter) {
      // Есть фильтр — генерируем код обработки
      const filterCode = generateVariableFilterCode(fullName, filter, indent);
      if (filterCode) {
        codeLines.push(filterCode);
        // Заменяем {var|filter} на {var_filtered}
        processedText = processedText.replace(
          `{${fullName}${filter}}`,
          `{${fullName}_filtered}`
        );
      }
    }
  }
  
  if (codeLines.length > 0) {
    codeLines.push('');
  }
  
  return codeLines.join('\n') + processedText;
}
